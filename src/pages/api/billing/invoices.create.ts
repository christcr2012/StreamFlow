// src/pages/api/billing/invoices.create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { Prisma, LeadStatus } from "@prisma/client";
import { computeWindow, endOfDayUTC } from "@/lib/reportingWindow";
import { verifyFederation, federationOverridesRBAC } from "@/lib/providerFederationVerify";

/**
 * Provider actions (WRITE): create/reuse a monthly draft invoice for eligible leads.
 *
 * Federation Support:
 *  - If PROVIDER_FEDERATION_ENABLED=1 and a signed request arrives from your
 *    future Provider Portal, verifyFederation(req) will return ok:true.
 *  - When ok:true and scope==="provider", we bypass the normal PERMS.BILLING_MANAGE
 *    check (machine-to-machine provider authority).
 *  - If disabled (default), behavior is unchanged.
 *
 * Security Note:
 *  - See /src/lib/providerFederationVerify.ts for signature details and how to
 *    upgrade to HMAC-SHA256. You can also force SHA256 in both client/server
 *    shims via env without code edits once you’re ready.
 */

// Helper: narrow billing JSON
type BillingInfo = {
  unitPriceCents?: number;
  billableEligible?: boolean;
  billedAt?: string | null;
};
function getBilling(obj: unknown): BillingInfo | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  const b = o["billing"];
  if (!b || typeof b !== "object") return undefined;
  const bb = b as Record<string, unknown>;
  return {
    unitPriceCents: typeof bb.unitPriceCents === "number" ? bb.unitPriceCents : undefined,
    billableEligible: typeof bb.billableEligible === "boolean" ? bb.billableEligible : undefined,
    billedAt: typeof bb.billedAt === "string" ? bb.billedAt : null,
  };
}

function nextInvoiceNumber(prefix = "LI"): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
  return `${prefix}-${ts}`;
}

/**
 * Creates (or reuses) a LeadInvoice for all eligible leads in the selected window.
 * Eligibility:
 *   - status CONVERTED
 *   - sourceType SYSTEM or systemGenerated = true
 *   - enrichmentJson.billing.billableEligible = true
 *   - enrichmentJson.billing.billedAt is null/absent
 * Window:
 *   - by convertedAt within [from, to]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      (res as any).setHeader("Allow", "POST");
      return res.status(405).end();
    }

    // ---- Provider Federation (optional, off by default) ---------------------
    const fed = await verifyFederation(req);
    // If not a federated provider call, enforce interactive RBAC for providers:
    if (!federationOverridesRBAC(fed)) {
      if (!(await assertPermission(req, res, PERMS.BILLING_MANAGE))) return;
    }
    // -------------------------------------------------------------------------

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    const { from, to, label } = computeWindow(req.query);

    // Idempotency: if a draft/open invoice exists for this org & exact period, reuse it.
    const existing = await db.leadInvoice.findFirst({
      where: {
        orgId,
        periodFrom: from,
        periodTo: endOfDayUTC(to),
        status: { in: ["draft", "open"] },
      },
      include: { lines: true },
    });
    if (existing) {
      const subtotalCents = existing.lines.reduce((s, x) => s + x.amountCents, 0);
      const taxCents = existing.taxCents ?? 0;
      return res.status(200).json({
        ok: true,
        reused: true,
        invoice: existing,
        window: { label, fromISO: from.toISOString().slice(0, 10), toISO: to.toISOString().slice(0, 10) },
        counts: { leads: existing.leadCount, lines: existing.lines.length },
        totals: { subtotalCents, taxCents, totalCents: subtotalCents + taxCents },
      });
    }

    // Collect eligible leads in the window by convertedAt
    const leads = await db.lead.findMany({
      where: {
        orgId,
        convertedAt: { gte: from, lte: endOfDayUTC(to) },
        status: { in: [LeadStatus.CONVERTED] },
        OR: [{ sourceType: "SYSTEM" as any }, { systemGenerated: true }],
        AND: [
          { enrichmentJson: { path: ["billing"], not: Prisma.JsonNull } },
          { enrichmentJson: { path: ["billing", "billableEligible"], equals: true as any } },
          {
            OR: [
              { enrichmentJson: { path: ["billing", "billedAt"], equals: Prisma.JsonNull } },
              { enrichmentJson: { path: ["billing", "billedAt"], equals: null as any } },
            ],
          },
        ],
      },
      select: { id: true, publicId: true, enrichmentJson: true },
    });

    if (leads.length === 0) {
      return res.status(200).json({
        ok: true,
        message: "No eligible leads found",
        invoice: null,
        window: { label, fromISO: from.toISOString().slice(0, 10), toISO: to.toISOString().slice(0, 10) },
        counts: { leads: 0, lines: 0 },
        totals: { subtotalCents: 0, taxCents: 0, totalCents: 0 },
      });
    }

    // Build invoice lines and totals
    const nowISO = new Date().toISOString();
    const lines = leads.map((l) => {
      const billing = getBilling(l.enrichmentJson);
      const unitCents = Number(billing?.unitPriceCents ?? 0);
      const qty = 1;
      const amountCents = qty * unitCents;
      return {
        leadId: l.id,
        description: `Lead ${l.publicId || l.id}`,
        quantity: qty,
        unitPriceCents: unitCents,
        amountCents,
        source: "conversion",
      };
    });

    const subtotalCents = lines.reduce((s, x) => s + x.amountCents, 0);
    const taxCents = 0;
    const totalCents = subtotalCents + taxCents;

    const invoice = await db.$transaction(async (tx) => {
      const inv = await tx.leadInvoice.create({
        data: {
          orgId,
          number: nextInvoiceNumber(),
          periodFrom: from,
          periodTo: endOfDayUTC(to),
          status: "draft",
          subtotalCents,
          taxCents,
          totalCents,
          currency: "usd",
          leadCount: lines.length,
          lines: { create: lines },
        },
        include: { lines: true },
      });

      // Mark leads as billed
      await tx.lead.updateMany({
        where: { id: { in: leads.map((l) => l.id) } },
        data: {
          enrichmentJson: {
            set: {
              billing: {
                billedAt: nowISO,
                billableEligible: true,
                unitPriceCents: lines.length > 0 ? lines[0].unitPriceCents : 10000,
              },
            },
          },
        },
      });

      return inv;
    });

    return res.status(200).json({
      ok: true,
      reused: false,
      invoice,
      window: { label, fromISO: from.toISOString().slice(0, 10), toISO: to.toISOString().slice(0, 10) },
      counts: { leads: leads.length, lines: lines.length },
      totals: { subtotalCents, taxCents, totalCents },
    });
  } catch (err: unknown) {
    console.error("/api/billing/invoices.create error:", err);
    const msg = (err as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}

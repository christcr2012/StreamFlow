// src/pages/api/billing/preview.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { Prisma, LeadStatus } from "@prisma/client";
import { computeWindow, endOfDayUTC } from "@/lib/reportingWindow";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!(await assertPermission(req, res, PERMS.BILLING_MANAGE))) return;

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    const { from, to, label } = computeWindow(req.query);

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
      orderBy: { convertedAt: "desc" },
      select: {
        id: true,
        publicId: true,
        convertedAt: true,
        enrichmentJson: true,
      },
    });

    const lines = leads.map((l) => {
      const billing = getBilling(l.enrichmentJson);
      return {
        leadId: l.id,
        leadPublicId: l.publicId,
        when: l.convertedAt,
        unitPriceCents: Number(billing?.unitPriceCents ?? 0),
        amountCents: Number(billing?.unitPriceCents ?? 0),
      };
    });

    const totalCents = lines.reduce((s, x) => s + x.amountCents, 0);

    return res.status(200).json({
      ok: true,
      count: leads.length,
      totalCents,
      window: { label, fromISO: from.toISOString().slice(0, 10), toISO: to.toISOString().slice(0, 10) },
      lines,
    });
  } catch (err: unknown) {
    console.error("/api/billing/preview error:", err);
    const msg = (err as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}

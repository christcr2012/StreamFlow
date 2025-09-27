// src/pages/api/integrations/stripe/create-hosted-invoice.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS, getOrgIdFromReq } from "@/lib/rbac";
import { verifyFederation, federationOverridesRBAC } from "@/lib/providerFederationVerify";

/**
 * Provider action (WRITE): Create a Stripe hosted invoice from a LeadInvoice draft.
 *
 * Federation Support:
 *  - When PROVIDER_FEDERATION_ENABLED=1 and request is signed by your Provider Portal,
 *    verifyFederation(req) grants provider-level authority (scope==="provider").
 *  - Otherwise we enforce interactive RBAC (PERMS.BILLING_MANAGE).
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      (res as any).setHeader("Allow", "POST");
      return res.status(405).end();
    }

    // Optional federation bypass for provider M2M calls
    const fed = await verifyFederation(req);
    if (!federationOverridesRBAC(fed)) {
      if (!(await assertPermission(req, res, PERMS.BILLING_MANAGE))) return;
    }

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: "Missing invoice id" });

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    const inv = await db.leadInvoice.findFirst({
      where: { id, orgId },
      include: { lines: true, org: true },
    });
    if (!inv) return res.status(404).json({ ok: false, error: "Invoice not found" });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2023-10-16" });

    // Find or create Stripe customer per org
    const org = await db.org.findUnique({ where: { id: orgId } });
    const settings = (org?.settingsJson as any) || {};
    let customerId: string | null = settings.stripeCustomerId || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org?.name || "Customer",
        metadata: { orgId },
      });
      customerId = customer.id;
      await db.org.update({
        where: { id: orgId },
        data: { settingsJson: { ...(org?.settingsJson as any), stripeCustomerId: customerId } },
      });
    }

    // Create invoice items for each line
    for (const line of inv.lines) {
      await stripe.invoiceItems.create({
        customer: customerId!,
        amount: line.amountCents,
        currency: inv.currency,
        description: line.description,
      });
    }

    const sInvoice = await stripe.invoices.create({
      customer: customerId!,
      collection_method: "send_invoice",
      days_until_due: 15,
      metadata: { leadInvoiceId: inv.id, orgId },
    });

    await db.leadInvoice.update({
      where: { id: inv.id },
      data: { stripeInvoiceId: sInvoice.id, status: "open" },
    });

    return res.status(200).json({ ok: true, stripeInvoice: sInvoice });
  } catch (e: unknown) {
    console.error("/api/integrations/stripe/create-hosted-invoice error:", e);
    const msg = (e as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}

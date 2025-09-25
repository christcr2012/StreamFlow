// src/pages/api/billing/get.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS, getOrgIdFromReq } from "@/lib/rbac";
import { verifyFederation, federationOverridesRBAC } from "@/lib/providerFederationVerify";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const fed = await verifyFederation(req);

    // RBAC: provider federation can bypass; otherwise require DASHBOARD_VIEW
    if (!federationOverridesRBAC(fed)) {
      if (!(await assertPermission(req, res, PERMS.DASHBOARD_VIEW))) return;
    }

    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    const invoice = await db.leadInvoice.findFirst({
      where: { id, orgId },
      include: {
        lines: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPriceCents: true,
            amountCents: true,
            leadId: true,
            lead: { select: { publicId: true } },
          },
        },
      },
    });

    if (!invoice) return res.status(404).json({ ok: false, error: "Not found" });

    const lines = invoice.lines.map((ln) => ({
      ...ln,
      leadPublicId: ln.lead?.publicId ?? null,
    }));

    res.status(200).json({ ok: true, invoice: { ...invoice, lines } });
  } catch (e: unknown) {
    console.error("/api/billing/get error:", e);
    const msg = (e as { message?: string })?.message ?? "Internal Server Error";
    res.status(500).json({ ok: false, error: msg });
  }
}

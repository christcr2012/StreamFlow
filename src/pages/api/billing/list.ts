// src/pages/api/billing/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS, getOrgIdFromReq } from "@/lib/rbac";
import { verifyFederation, federationOverridesRBAC } from "@/lib/providerFederationVerify";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Optional federation check (non-invasive; disabled unless env flag is set)
    const fed = await verifyFederation(req);

    // RBAC: allow provider federation to bypass user permission checks;
    // otherwise require client-facing read permission (DASHBOARD_VIEW).
    if (!federationOverridesRBAC(fed)) {
      if (!(await assertPermission(req, res, PERMS.DASHBOARD_VIEW))) return;
    }

    // Org scoping:
    // - In single-tenant deployments, getOrgIdFromReq() is sufficient.
    // - If you later run multi-tenant in a single codebase, consider honoring fed.orgHint.
    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    const items = await db.leadInvoice.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        number: true,
        periodFrom: true,
        periodTo: true,
        status: true,
        totalCents: true,
        subtotalCents: true,
        taxCents: true,
        createdAt: true,
        stripeInvoiceId: true,
      },
    });

    res.status(200).json({ ok: true, items });
  } catch (e: unknown) {
    console.error("/api/billing/list error:", e);
    const msg = (e as { message?: string })?.message ?? "Internal Server Error";
    res.status(500).json({ ok: false, error: msg });
  }
}

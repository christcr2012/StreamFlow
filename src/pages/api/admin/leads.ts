// src/pages/api/admin/leads.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require read permission (OWNER/MANAGER/STAFF typically have this)
  if (!(await assertPermission(req, res, PERMS.LEAD_READ))) return;

  switch (req.method) {
    case "GET": {
      const orgId = await getOrgIdFromReq(req);
      if (!orgId) return res.status(400).json({ ok: false, error: "No org for current user" });

      const leads = await db.lead.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return res.status(200).json({ ok: true, leads });
    }

    default: {
      res.setHeader("Allow", "GET");
      return res.status(405).end("Method Not Allowed");
    }
  }
}

// src/pages/api/whoami.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getEmailFromReq } from "@/lib/rbac";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const email = getEmailFromReq(req);
  if (!email) return res.status(200).json({ user: null });

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, orgId: true, status: true },
  });

  return res.status(200).json({ user: user ?? null });
}

// src/pages/api/admin/org-config.ts
// API endpoint for organization-level configuration. Allows owners to view and
// update their Org's brandConfig and settingsJson. Only users with role OWNER
// may access this endpoint. Other roles receive 403.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getEmailFromReq } from "@/lib/rbac";

async function ensureOwner(req: NextApiRequest, res: NextApiResponse): Promise<{ ok: false } | { ok: true; user: { id: string; role: string; orgId: string }; orgId: string }> {
  const email = getEmailFromReq(req);
  if (!email) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return { ok: false };
  }
  const user = await db.user.findUnique({ where: { email }, select: { id: true, role: true, orgId: true } });
  if (!user) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return { ok: false };
  }
  if (user.role !== "OWNER") {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return { ok: false };
  }
  return { ok: true, user, orgId: user.orgId };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await ensureOwner(req, res);
  if (!("ok" in auth) || !auth.ok) return;
  const orgId = auth.orgId;

  if (req.method === "GET") {
    const org = await db.org.findUnique({ where: { id: orgId }, select: { brandConfig: true, settingsJson: true } });
    res.status(200).json({ ok: true, brandConfig: org?.brandConfig ?? {}, settingsJson: org?.settingsJson ?? {} });
    return;
  }

  if (req.method === "POST" || req.method === "PUT") {
    const body = (req.body || {}) as Record<string, unknown>;
    const { brandConfig, settingsJson } = body as {
      brandConfig?: unknown;
      settingsJson?: unknown;
    };
    // Accept JSON objects; ensure they are passed through unchanged.
    const updateData: Record<string, unknown> = {};
    if (brandConfig !== undefined) updateData.brandConfig = brandConfig;
    if (settingsJson !== undefined) updateData.settingsJson = settingsJson;
    const updated = await db.org.update({ where: { id: orgId }, data: updateData });
    res.status(200).json({ ok: true, brandConfig: updated.brandConfig ?? {}, settingsJson: updated.settingsJson ?? {} });
    return;
  }

  res.setHeader("Allow", "GET, POST, PUT");
  res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
// src/pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { PERMS as SERVER_PERMS, getEmailFromReq } from "@/lib/rbac";
import type { MeResponse, OrgShape } from "@/lib/types/me";

/**
 * Compute effective permission codes for a user:
 *  - Union of all permissions from RBAC roles assigned to the user
 *  - Plus legacy fallbacks based on baseRole (OWNER/MANAGER/STAFF)
 */
async function computePermCodes(userId: string, baseRole?: string | null): Promise<Set<string>> {
  const roleLinks = await db.rbacUserRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const roleIds = roleLinks.map((r) => r.roleId);
  const rolePerms = roleIds.length
    ? await db.rbacRolePermission.findMany({
        where: { roleId: { in: roleIds } },
        include: { permission: true },
      })
    : [];

  const codes = new Set<string>(rolePerms.map((rp) => rp.permission.code));

  // Legacy fallbacks for convenience (aligns with src/lib/rbac.ts)
  switch ((baseRole || "").toUpperCase()) {
    case "OWNER":
      Object.values(SERVER_PERMS).forEach((c) => codes.add(c));
      break;
    case "MANAGER":
      ["dashboard:view", "lead:read", "lead:create", "lead:update", "lead:delete", "lead:export"].forEach((c) =>
        codes.add(c)
      );
      break;
    case "STAFF":
      ["dashboard:view", "lead:read", "lead:create", "lead:update"].forEach((c) => codes.add(c));
      break;
    // PROVIDER / ACCOUNTANT / VIEWER: no implicit extras here
  }

  return codes;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MeResponse>) {
  try {
    const email = getEmailFromReq(req);
    if (!email) return res.status(401).json({ ok: false, error: "Not signed in" });

    // Dev bypass: grant all perms if DEV_USER_EMAIL matches
    const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL?.toLowerCase() || null;
    if (DEV_USER_EMAIL && email.toLowerCase() === DEV_USER_EMAIL) {
      const perms = Object.values(SERVER_PERMS);
      return res.status(200).json({
        ok: true,
        user: {
          email,
          name: "Dev User",
          baseRole: "OWNER",
          rbacRoles: [],
          isOwner: true,
          isProvider: true,
          perms,
        },
      });
    }

    const user = await db.user.findFirst({
      where: { email },
      select: { id: true, email: true, name: true, role: true, orgId: true },
    });
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    // RBAC role slugs for the user
    const links = await db.rbacUserRole.findMany({
      where: { userId: user.id },
      select: { role: { select: { slug: true } } },
    });
    const rbacSlugs = Array.from(new Set(links.map((l) => l.role.slug).filter(Boolean)));

    const isOwner = (user.role || "").toUpperCase() === "OWNER" || rbacSlugs.includes("owner");
    const isProvider = rbacSlugs.includes("provider");

    // Optional org info
    let orgPayload: OrgShape | undefined;
    if (user.orgId) {
      const org = await db.org.findUnique({
        where: { id: user.orgId },
        select: { id: true, name: true, featureFlags: true },
      });
      if (org) {
        orgPayload = {
          id: org.id,
          name: org.name,
          /**
           * IMPORTANT CONTRACT:
           * - We intentionally pass featureFlags through as-is (unknown JSON).
           * - Client code should narrow with helpers (see src/lib/featureFlags.ts)
           *   to avoid assuming a premature shape while the system is evolving.
           */
          featureFlags: org.featureFlags as unknown,
        };
      }
    }

    // Effective permission codes
    const codes = await computePermCodes(user.id, user.role);
    const perms = Array.from(codes).sort();

    return res.status(200).json({
      ok: true,
      user: {
        email: user.email,
        name: user.name,
        baseRole: (user.role || "VIEWER") as MeResponse["user"]["baseRole"],
        rbacRoles: rbacSlugs,
        isOwner,
        isProvider,
        perms,
      },
      ...(orgPayload ? { org: orgPayload } : {}),
    });
  } catch (e: unknown) {
    const msg = (e as { message?: string } | undefined)?.message || "Server error";
    return res.status(500).json({ ok: false, error: msg });
  }
}

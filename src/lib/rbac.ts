// src/lib/rbac.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";

/**
 * Permission catalog. Keep codes in sync with seed.
 */
export const PERMS = {
  DASHBOARD_VIEW: "dashboard:view",
  LEAD_READ: "lead:read",
  LEAD_CREATE: "lead:create",
  LEAD_UPDATE: "lead:update",
  LEAD_DELETE: "lead:delete",
  LEAD_EXPORT: "lead:export",
  ROLES_MANAGE: "roles:manage",
  BILLING_MANAGE: "billing:manage",
} as const;
export type PermCode = (typeof PERMS)[keyof typeof PERMS];

/**
 * Email that should bypass RBAC permission checks entirely.
 * If DEV_USER_EMAIL is set in the environment, any request from that
 * email address will be treated as having all permissions. This is
 * useful for development and automated testing. In production you
 * should leave DEV_USER_EMAIL unset.
 */
const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL?.toLowerCase() || null;

/**
 * Extract current user's email from cookie or header.
 * - Cookie: mv_user=<email>
 * - Header: x-mv-user: <email>  (useful for scripts/tests)
 */
export function getEmailFromReq(req: NextApiRequest): string | null {
  const fromCookie = req.cookies?.mv_user;
  const fromHeader = (req.headers["x-mv-user"] || req.headers["x-mvuser"]) as string | undefined;
  const raw = (Array.isArray(fromCookie) ? fromCookie[0] : fromCookie) ?? fromHeader ?? "";
  const email = raw?.toString().trim().toLowerCase();
  return email || null;
}

/** Look up orgId for current user (used to scope queries). */
export async function getOrgIdFromReq(req: NextApiRequest): Promise<string | null> {
  const email = getEmailFromReq(req);
  if (!email) return null;

  // Development bypass: if this is the dev user, return a fixed orgId
  // if provided via DEV_ORG_ID, otherwise fall through to DB lookup.
  if (DEV_USER_EMAIL && email === DEV_USER_EMAIL) {
    // Use DEV_ORG_ID if provided, else null to indicate no org
    const devOrg = process.env.DEV_ORG_ID;
    if (devOrg) return devOrg;
    // As a fallback, attempt to fetch the first org from the database
    try {
      const firstOrg = await db.org.findFirst({ select: { id: true } });
      return firstOrg?.id ?? null;
    } catch {
      return null;
    }
  }
  const u = await db.user.findUnique({ where: { email }, select: { orgId: true } });
  return u?.orgId ?? null;
}

/**
 * Fetch user's effective permissions from RBAC tables.
 * Falls back to legacy User.role for OWNER/MANAGER/STAFF convenience.
 */
async function getUserPermCodes(userId: string, legacyRole?: string | null): Promise<Set<string>> {
  const roleLinks = await db.rbacUserRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const roleIds = roleLinks.map((r) => r.roleId);
  const perms = roleIds.length
    ? await db.rbacRolePermission.findMany({
        where: { roleId: { in: roleIds } },
        include: { permission: true },
      })
    : [];

  const codes = new Set<string>(perms.map((rp) => rp.permission.code));

  // Legacy role convenience (non-blocking): give sensible defaults
  switch ((legacyRole || "").toUpperCase()) {
    case "OWNER":
      [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_DELETE, PERMS.LEAD_EXPORT, PERMS.ROLES_MANAGE, PERMS.BILLING_MANAGE].forEach(c => codes.add(c));
      break;
    case "MANAGER":
      [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_DELETE, PERMS.LEAD_EXPORT].forEach(c => codes.add(c));
      break;
    case "STAFF":
      [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE].forEach(c => codes.add(c));
      break;
  }

  return codes;
}

/**
 * Assert that current request is from an authenticated user with a given permission.
 * Writes 401/403 to res if not allowed. Returns true if allowed, false otherwise.
 */
export async function assertPermission(
  req: NextApiRequest,
  res: NextApiResponse,
  required: PermCode
): Promise<boolean> {
  try {
    const email = getEmailFromReq(req);
    if (!email) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return false;
    }

    // Development bypass: if the incoming email matches the DEV_USER_EMAIL
    // then skip any database lookups and allow the request. This permits
    // automated tests and development sessions to exercise any API
    // regardless of the user's persisted role or permissions. If no
    // DEV_USER_EMAIL is configured, this block has no effect.
    if (DEV_USER_EMAIL && email === DEV_USER_EMAIL) {
      return true;
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return false;
    }

    const codes = await getUserPermCodes(user.id, user.role);
    if (!codes.has(required)) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return false;
    }
    return true;
  } catch (e: unknown) {
    console.error("assertPermission error:", e);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
    return false;
  }
}

// src/lib/rbac.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";

/**
 * Enterprise-Grade Permission Catalog
 * Granular read/write permissions for all business modules
 * Keep codes in sync with seed.
 */
export const PERMS = {
  // Dashboard & Analytics
  DASHBOARD_VIEW: "dashboard:view",
  ANALYTICS_READ: "analytics:read",
  REPORTS_READ: "reports:read",
  REPORTS_CREATE: "reports:create",
  REPORTS_EXPORT: "reports:export",

  // Lead Management
  LEAD_READ: "lead:read",
  LEAD_CREATE: "lead:create",
  LEAD_UPDATE: "lead:update",
  LEAD_DELETE: "lead:delete",
  LEAD_EXPORT: "lead:export",
  LEAD_ASSIGN: "lead:assign",
  LEAD_CONVERT: "lead:convert",

  // Job Management
  JOB_READ: "job:read",
  JOB_CREATE: "job:create",
  JOB_UPDATE: "job:update",
  JOB_DELETE: "job:delete",
  JOB_ASSIGN: "job:assign",
  JOB_SCHEDULE: "job:schedule",
  JOB_COMPLETE: "job:complete",

  // Workforce Management
  EMPLOYEE_READ: "employee:read",
  EMPLOYEE_CREATE: "employee:create",
  EMPLOYEE_UPDATE: "employee:update",
  EMPLOYEE_DELETE: "employee:delete",
  EMPLOYEE_SCHEDULE: "employee:schedule",
  PAYROLL_READ: "payroll:read",
  PAYROLL_MANAGE: "payroll:manage",
  TIMECLOCK_READ: "timeclock:read",
  TIMECLOCK_MANAGE: "timeclock:manage",

  // HR Management
  HR_READ: "hr:read",
  HR_MANAGE: "hr:manage",
  HR_HIRE: "hr:hire",
  HR_TERMINATE: "hr:terminate",
  TRAINING_READ: "training:read",
  TRAINING_MANAGE: "training:manage",
  TRAINING_ASSIGN: "training:assign",

  // Client & Customer Management
  CLIENT_READ: "client:read",
  CLIENT_CREATE: "client:create",
  CLIENT_UPDATE: "client:update",
  CLIENT_DELETE: "client:delete",
  CLIENT_COMMUNICATE: "client:communicate",

  // Financial Management
  BILLING_READ: "billing:read",
  BILLING_MANAGE: "billing:manage",
  INVOICE_READ: "invoice:read",
  INVOICE_CREATE: "invoice:create",
  INVOICE_UPDATE: "invoice:update",
  INVOICE_DELETE: "invoice:delete",
  PAYMENT_READ: "payment:read",
  PAYMENT_PROCESS: "payment:process",
  REVENUE_READ: "revenue:read",
  REVENUE_MANAGE: "revenue:manage",

  // Operations & Scheduling
  SCHEDULE_READ: "schedule:read",
  SCHEDULE_MANAGE: "schedule:manage",
  OPERATIONS_READ: "operations:read",
  OPERATIONS_MANAGE: "operations:manage",
  INVENTORY_READ: "inventory:read",
  INVENTORY_MANAGE: "inventory:manage",

  // System Administration
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_IMPERSONATE: "user:impersonate",
  PASSWORD_RESET: "password:reset",
  ROLES_READ: "roles:read",
  ROLES_MANAGE: "roles:manage",
  SYSTEM_SETTINGS: "system:settings",
  SYSTEM_BACKUP: "system:backup",
  AUDIT_READ: "audit:read",

  // Provider Portal (White-label)
  PROVIDER_DASHBOARD: "provider:dashboard",
  PROVIDER_BILLING: "provider:billing",
  PROVIDER_ANALYTICS: "provider:analytics",
  PROVIDER_SETTINGS: "provider:settings",
  PROVIDER_CLIENTS: "provider:clients",

  // Document & Asset Management
  DOCUMENT_READ: "document:read",
  DOCUMENT_CREATE: "document:create",
  DOCUMENT_UPDATE: "document:update",
  DOCUMENT_DELETE: "document:delete",
  MEDIA_READ: "media:read",
  MEDIA_UPLOAD: "media:upload",
  MEDIA_DELETE: "media:delete",
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

  // Legacy role convenience (non-blocking): give sensible defaults based on enterprise role hierarchy
  switch ((legacyRole || "").toUpperCase()) {
    case "OWNER":
      // Owners get full system access - all permissions
      Object.values(PERMS).forEach(c => codes.add(c));
      break;
    case "MANAGER":
      // Managers get operational control but limited system administration
      [
        PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_READ, PERMS.REPORTS_CREATE, PERMS.REPORTS_EXPORT,
        PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_DELETE, PERMS.LEAD_EXPORT, PERMS.LEAD_ASSIGN, PERMS.LEAD_CONVERT,
        PERMS.JOB_READ, PERMS.JOB_CREATE, PERMS.JOB_UPDATE, PERMS.JOB_DELETE, PERMS.JOB_ASSIGN, PERMS.JOB_SCHEDULE, PERMS.JOB_COMPLETE,
        PERMS.EMPLOYEE_READ, PERMS.EMPLOYEE_UPDATE, PERMS.EMPLOYEE_SCHEDULE, PERMS.PAYROLL_READ, PERMS.TIMECLOCK_READ, PERMS.TIMECLOCK_MANAGE,
        PERMS.TRAINING_READ, PERMS.TRAINING_ASSIGN, PERMS.CLIENT_READ, PERMS.CLIENT_CREATE, PERMS.CLIENT_UPDATE, PERMS.CLIENT_COMMUNICATE,
        PERMS.BILLING_READ, PERMS.INVOICE_READ, PERMS.INVOICE_CREATE, PERMS.INVOICE_UPDATE, PERMS.PAYMENT_READ, PERMS.REVENUE_READ,
        PERMS.SCHEDULE_READ, PERMS.SCHEDULE_MANAGE, PERMS.OPERATIONS_READ, PERMS.OPERATIONS_MANAGE, PERMS.INVENTORY_READ, PERMS.INVENTORY_MANAGE,
        PERMS.DOCUMENT_READ, PERMS.DOCUMENT_CREATE, PERMS.DOCUMENT_UPDATE, PERMS.MEDIA_READ, PERMS.MEDIA_UPLOAD
      ].forEach(c => codes.add(c));
      break;
    case "STAFF":
      // Staff get basic operational access - mostly read with limited write
      [
        PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE,
        PERMS.JOB_READ, PERMS.JOB_UPDATE, PERMS.TIMECLOCK_READ, PERMS.TRAINING_READ,
        PERMS.CLIENT_READ, PERMS.SCHEDULE_READ, PERMS.OPERATIONS_READ, PERMS.INVENTORY_READ,
        PERMS.DOCUMENT_READ, PERMS.MEDIA_READ
      ].forEach(c => codes.add(c));
      break;
    case "ACCOUNTANT":
      // Accountants get financial and HR management access
      [
        PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_READ, PERMS.REPORTS_CREATE, PERMS.REPORTS_EXPORT,
        PERMS.EMPLOYEE_READ, PERMS.PAYROLL_READ, PERMS.PAYROLL_MANAGE, PERMS.TIMECLOCK_READ, PERMS.HR_READ,
        PERMS.BILLING_READ, PERMS.BILLING_MANAGE, PERMS.INVOICE_READ, PERMS.INVOICE_CREATE, PERMS.INVOICE_UPDATE, PERMS.INVOICE_DELETE,
        PERMS.PAYMENT_READ, PERMS.PAYMENT_PROCESS, PERMS.REVENUE_READ, PERMS.REVENUE_MANAGE,
        PERMS.DOCUMENT_READ, PERMS.DOCUMENT_CREATE, PERMS.AUDIT_READ
      ].forEach(c => codes.add(c));
      break;
    case "PROVIDER":
      // Provider gets provider portal access and client management
      [
        PERMS.PROVIDER_DASHBOARD, PERMS.PROVIDER_BILLING, PERMS.PROVIDER_ANALYTICS, PERMS.PROVIDER_SETTINGS, PERMS.PROVIDER_CLIENTS,
        PERMS.ANALYTICS_READ, PERMS.REPORTS_READ, PERMS.BILLING_READ, PERMS.REVENUE_READ
      ].forEach(c => codes.add(c));
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

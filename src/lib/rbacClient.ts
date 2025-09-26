// src/lib/rbacClient.ts
/**
 * Client-side RBAC shim.
 *
 * Purpose:
 *  - Normalize whatever the identity layer returns (rbacRoles, perms, roles).
 *  - Provide a single 'hasPerm(..)' for UI gating (show/hide buttons, pages).
 *
 * SECURITY NOTE:
 *  - Server-side RBAC remains authoritative via assertPermission().
 *  - Client checks are convenience only; never rely on them for security.
 */

// Enterprise-Grade Permission Constants - Client Side
// IMPORTANT: These MUST match server PERMS codes exactly (colon-scoped format)
// Keep in sync with server PERMS names in src/lib/rbac.ts.
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
export type PermName = typeof PERMS[keyof typeof PERMS];

/**
 * Some identity providers return roles not perms. Map roles → implied perms here.
 * Keep in sync with server role mapping (if any).
 */
const ROLE_TO_PERMS: Record<string, PermName[]> = {
  OWNER: [
    // Dashboard & Analytics
    PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_READ, PERMS.REPORTS_CREATE, PERMS.REPORTS_EXPORT,
    // Lead Management
    PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_DELETE, PERMS.LEAD_EXPORT, PERMS.LEAD_ASSIGN, PERMS.LEAD_CONVERT,
    // Job Management
    PERMS.JOB_READ, PERMS.JOB_CREATE, PERMS.JOB_UPDATE, PERMS.JOB_DELETE, PERMS.JOB_ASSIGN, PERMS.JOB_SCHEDULE, PERMS.JOB_COMPLETE,
    // Workforce Management
    PERMS.EMPLOYEE_READ, PERMS.EMPLOYEE_CREATE, PERMS.EMPLOYEE_UPDATE, PERMS.EMPLOYEE_DELETE, PERMS.EMPLOYEE_SCHEDULE,
    PERMS.PAYROLL_READ, PERMS.PAYROLL_MANAGE, PERMS.TIMECLOCK_READ, PERMS.TIMECLOCK_MANAGE,
    // HR Management
    PERMS.HR_READ, PERMS.HR_MANAGE, PERMS.HR_HIRE, PERMS.HR_TERMINATE, PERMS.TRAINING_READ, PERMS.TRAINING_MANAGE, PERMS.TRAINING_ASSIGN,
    // Client Management
    PERMS.CLIENT_READ, PERMS.CLIENT_CREATE, PERMS.CLIENT_UPDATE, PERMS.CLIENT_DELETE, PERMS.CLIENT_COMMUNICATE,
    // Financial Management
    PERMS.BILLING_READ, PERMS.BILLING_MANAGE, PERMS.INVOICE_READ, PERMS.INVOICE_CREATE, PERMS.INVOICE_UPDATE, PERMS.INVOICE_DELETE,
    PERMS.PAYMENT_READ, PERMS.PAYMENT_PROCESS, PERMS.REVENUE_READ, PERMS.REVENUE_MANAGE,
    // Operations & Scheduling
    PERMS.SCHEDULE_READ, PERMS.SCHEDULE_MANAGE, PERMS.OPERATIONS_READ, PERMS.OPERATIONS_MANAGE, PERMS.INVENTORY_READ, PERMS.INVENTORY_MANAGE,
    // System Administration
    PERMS.USER_READ, PERMS.USER_CREATE, PERMS.USER_UPDATE, PERMS.USER_DELETE, PERMS.PASSWORD_RESET, PERMS.ROLES_READ, PERMS.ROLES_MANAGE,
    PERMS.SYSTEM_SETTINGS, PERMS.SYSTEM_BACKUP, PERMS.AUDIT_READ,
    // Provider Portal
    PERMS.PROVIDER_DASHBOARD, PERMS.PROVIDER_BILLING, PERMS.PROVIDER_ANALYTICS, PERMS.PROVIDER_SETTINGS, PERMS.PROVIDER_CLIENTS,
    // Document & Media
    PERMS.DOCUMENT_READ, PERMS.DOCUMENT_CREATE, PERMS.DOCUMENT_UPDATE, PERMS.DOCUMENT_DELETE, PERMS.MEDIA_READ, PERMS.MEDIA_UPLOAD, PERMS.MEDIA_DELETE
  ],
  MANAGER: [
    // Dashboard & Analytics
    PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_READ, PERMS.REPORTS_CREATE,
    // Lead Management
    PERMS.LEAD_READ, PERMS.LEAD_CREATE, PERMS.LEAD_UPDATE, PERMS.LEAD_ASSIGN, PERMS.LEAD_CONVERT,
    // Job Management
    PERMS.JOB_READ, PERMS.JOB_CREATE, PERMS.JOB_UPDATE, PERMS.JOB_ASSIGN, PERMS.JOB_SCHEDULE, PERMS.JOB_COMPLETE,
    // Workforce Management
    PERMS.EMPLOYEE_READ, PERMS.EMPLOYEE_UPDATE, PERMS.EMPLOYEE_SCHEDULE, PERMS.TIMECLOCK_READ, PERMS.TIMECLOCK_MANAGE,
    // HR Management
    PERMS.HR_READ, PERMS.TRAINING_READ, PERMS.TRAINING_ASSIGN,
    // Client Management
    PERMS.CLIENT_READ, PERMS.CLIENT_UPDATE, PERMS.CLIENT_COMMUNICATE,
    // Financial Management
    PERMS.BILLING_READ, PERMS.INVOICE_READ, PERMS.INVOICE_CREATE, PERMS.PAYMENT_READ, PERMS.REVENUE_READ,
    // Operations & Scheduling
    PERMS.SCHEDULE_READ, PERMS.SCHEDULE_MANAGE, PERMS.OPERATIONS_READ, PERMS.INVENTORY_READ,
    // Document & Media
    PERMS.DOCUMENT_READ, PERMS.DOCUMENT_CREATE, PERMS.MEDIA_READ, PERMS.MEDIA_UPLOAD
  ],
  ACCOUNTANT: [
    // Dashboard & Analytics
    PERMS.DASHBOARD_VIEW, PERMS.ANALYTICS_READ, PERMS.REPORTS_READ, PERMS.REPORTS_CREATE, PERMS.REPORTS_EXPORT,
    // Financial Management
    PERMS.BILLING_READ, PERMS.BILLING_MANAGE, PERMS.INVOICE_READ, PERMS.INVOICE_CREATE, PERMS.INVOICE_UPDATE, PERMS.INVOICE_DELETE,
    PERMS.PAYMENT_READ, PERMS.PAYMENT_PROCESS, PERMS.REVENUE_READ, PERMS.REVENUE_MANAGE,
    // Workforce Management (Payroll)
    PERMS.PAYROLL_READ, PERMS.PAYROLL_MANAGE, PERMS.TIMECLOCK_READ,
    // Client Management (Billing)
    PERMS.CLIENT_READ, PERMS.CLIENT_COMMUNICATE,
    // Document & Media
    PERMS.DOCUMENT_READ, PERMS.DOCUMENT_CREATE, PERMS.MEDIA_READ
  ],
  STAFF: [
    // Dashboard & Analytics
    PERMS.DASHBOARD_VIEW,
    // Lead Management (Limited)
    PERMS.LEAD_READ,
    // Job Management (Own jobs)
    PERMS.JOB_READ,
    // Workforce Management (Self)
    PERMS.TIMECLOCK_READ, PERMS.TIMECLOCK_MANAGE,
    // HR Management (Self)
    PERMS.TRAINING_READ,
    // Operations (View only)
    PERMS.SCHEDULE_READ,
    // Document & Media
    PERMS.DOCUMENT_READ, PERMS.MEDIA_READ
  ],
};

/** Normalize possible shapes of the user object into a unique set of strings. */
export function normalizeStrings(me: unknown, keys: string[]): string[] {
  const out: string[] = [];
  if (me && typeof me === "object") {
    const m = me as Record<string, unknown>;
    for (const k of keys) {
      const v = m[k];
      if (Array.isArray(v)) for (const s of v) if (typeof s === "string") out.push(s);
    }
  }
  return Array.from(new Set(out));
}

/** Effective permissions from me.rbacRoles / me.perms / me.roles. */
export function effectivePerms(me: unknown): PermName[] {
  const roles = normalizeStrings(me, ["rbacRoles", "roles"]);
  const explicitPerms = normalizeStrings(me, ["perms"]);

  const fromRoles = roles.flatMap((r) => ROLE_TO_PERMS[r] || []);
  const all = new Set<PermName>([...fromRoles, ...explicitPerms.filter(Boolean) as PermName[]]);

  return Array.from(all);
}

/** Test for a permission in the computed set. */
export function hasPerm(me: unknown, perm: PermName): boolean {
  return effectivePerms(me).includes(perm);
}

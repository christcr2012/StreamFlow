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

// Canonical permission string constants used across the app.
// Keep in sync with server PERMS names in src/lib/rbac.ts.
export const PERMS = {
  DASHBOARD_VIEW: "DASHBOARD_VIEW",
  LEAD_READ: "LEAD_READ",
  LEAD_UPDATE: "LEAD_UPDATE",
  BILLING_MANAGE: "BILLING_MANAGE",
} as const;
export type PermName = typeof PERMS[keyof typeof PERMS];

/**
 * Some identity providers return roles not perms. Map roles → implied perms here.
 * Keep in sync with server role mapping (if any).
 */
const ROLE_TO_PERMS: Record<string, PermName[]> = {
  // Examples — tune as needed to reflect your real roles:
  admin: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_UPDATE, PERMS.BILLING_MANAGE],
  manager: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_UPDATE, PERMS.BILLING_MANAGE],
  agent: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ],
  billing: [PERMS.BILLING_MANAGE],
  // Support legacy uppercase roles too:
  ADMIN: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_UPDATE, PERMS.BILLING_MANAGE],
  MANAGER: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ, PERMS.LEAD_UPDATE, PERMS.BILLING_MANAGE],
  AGENT: [PERMS.DASHBOARD_VIEW, PERMS.LEAD_READ],
  BILLING: [PERMS.BILLING_MANAGE],
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

/**
 * RBAC Roles and Permissions
 * 
 * Defines the two-persona model:
 * - Provider (provider_admin, provider_analyst)
 * - Developer (developer)
 */

// ============================================
// PROVIDER ROLES
// ============================================

export const PROVIDER_ROLES = {
  ADMIN: 'provider_admin',
  ANALYST: 'provider_analyst',
} as const;

export type ProviderRole = typeof PROVIDER_ROLES[keyof typeof PROVIDER_ROLES];

export const PROVIDER_ROLE_DESCRIPTIONS: Record<ProviderRole, string> = {
  [PROVIDER_ROLES.ADMIN]: 'Full control over federation, monetization, billing, analytics, incidents, branding, and provisioning',
  [PROVIDER_ROLES.ANALYST]: 'Read-only access to analytics and audit logs; no write permissions on federation or monetization',
};

// ============================================
// DEVELOPER ROLE
// ============================================

export const DEVELOPER_ROLE = 'developer' as const;
export type DeveloperRole = typeof DEVELOPER_ROLE;

export const DEVELOPER_ROLE_DESCRIPTION = 'Access to developer tools (API explorer, app-scoped keys, webhooks sandbox, usage dashboards)';

// ============================================
// PERMISSIONS
// ============================================

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Federation
  FEDERATION_READ: 'federation:read',
  FEDERATION_WRITE: 'federation:write',
  FEDERATION_ADMIN: 'federation:admin',
  FEDERATION_KEYS_CREATE: 'federation:keys:create',
  FEDERATION_KEYS_DELETE: 'federation:keys:delete',
  FEDERATION_OIDC_CONFIGURE: 'federation:oidc:configure',
  FEDERATION_OIDC_TEST: 'federation:oidc:test',
  FEDERATION_PROVIDERS_MANAGE: 'federation:providers:manage',
  
  // Monetization
  MONETIZATION_READ: 'monetization:read',
  MONETIZATION_WRITE: 'monetization:write',
  MONETIZATION_PLANS_MANAGE: 'monetization:plans:manage',
  MONETIZATION_PRICES_MANAGE: 'monetization:prices:manage',
  MONETIZATION_COUPONS_MANAGE: 'monetization:coupons:manage',
  MONETIZATION_OVERRIDES_MANAGE: 'monetization:overrides:manage',
  
  // Billing
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',
  
  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Audit
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export',
  
  // Incidents
  INCIDENTS_READ: 'incidents:read',
  INCIDENTS_MANAGE: 'incidents:manage',
  
  // Branding
  BRANDING_READ: 'branding:read',
  BRANDING_MANAGE: 'branding:manage',
  
  // Provisioning
  PROVISIONING_READ: 'provisioning:read',
  PROVISIONING_MANAGE: 'provisioning:manage',
  
  // Leads
  LEADS_READ: 'leads:read',
  LEADS_MANAGE: 'leads:manage',
  
  // Developer Tools
  DEVELOPER_API_EXPLORER: 'developer:api-explorer',
  DEVELOPER_WEBHOOKS: 'developer:webhooks',
  DEVELOPER_KEYS: 'developer:keys',
  DEVELOPER_KEYS_READ: 'developer:keys:read',
  DEVELOPER_KEYS_CREATE: 'developer:keys:create',
  DEVELOPER_KEYS_DELETE: 'developer:keys:delete',
  DEVELOPER_USAGE: 'developer:usage',
  
  // Admin
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ============================================
// ROLE-PERMISSION MAPPINGS
// ============================================

export const ROLE_PERMISSIONS: Record<ProviderRole | DeveloperRole, Permission[]> = {
  // Provider Admin: Full access to everything
  [PROVIDER_ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FEDERATION_READ,
    PERMISSIONS.FEDERATION_WRITE,
    PERMISSIONS.FEDERATION_ADMIN,
    PERMISSIONS.FEDERATION_KEYS_CREATE,
    PERMISSIONS.FEDERATION_KEYS_DELETE,
    PERMISSIONS.FEDERATION_OIDC_CONFIGURE,
    PERMISSIONS.FEDERATION_OIDC_TEST,
    PERMISSIONS.FEDERATION_PROVIDERS_MANAGE,
    PERMISSIONS.MONETIZATION_READ,
    PERMISSIONS.MONETIZATION_WRITE,
    PERMISSIONS.MONETIZATION_PLANS_MANAGE,
    PERMISSIONS.MONETIZATION_PRICES_MANAGE,
    PERMISSIONS.MONETIZATION_COUPONS_MANAGE,
    PERMISSIONS.MONETIZATION_OVERRIDES_MANAGE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_EXPORT,
    PERMISSIONS.INCIDENTS_READ,
    PERMISSIONS.INCIDENTS_MANAGE,
    PERMISSIONS.BRANDING_READ,
    PERMISSIONS.BRANDING_MANAGE,
    PERMISSIONS.PROVISIONING_READ,
    PERMISSIONS.PROVISIONING_MANAGE,
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_MANAGE,
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.ADMIN_WRITE,
  ],
  
  // Provider Analyst: Read-only analytics and audit
  [PROVIDER_ROLES.ANALYST]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FEDERATION_READ,
    PERMISSIONS.MONETIZATION_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_EXPORT,
    PERMISSIONS.INCIDENTS_READ,
    PERMISSIONS.BRANDING_READ,
    PERMISSIONS.PROVISIONING_READ,
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.ADMIN_READ,
  ],
  
  // Developer: Access to developer tools
  [DEVELOPER_ROLE]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DEVELOPER_API_EXPLORER,
    PERMISSIONS.DEVELOPER_WEBHOOKS,
    PERMISSIONS.DEVELOPER_KEYS,
    PERMISSIONS.DEVELOPER_KEYS_READ,
    PERMISSIONS.DEVELOPER_KEYS_CREATE,
    PERMISSIONS.DEVELOPER_KEYS_DELETE,
    PERMISSIONS.DEVELOPER_USAGE,
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: ProviderRole | DeveloperRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: ProviderRole | DeveloperRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role is a provider role
 */
export function isProviderRole(role: string): role is ProviderRole {
  return Object.values(PROVIDER_ROLES).includes(role as ProviderRole);
}

/**
 * Check if a role is a developer role
 */
export function isDeveloperRole(role: string): role is DeveloperRole {
  return role === DEVELOPER_ROLE;
}

/**
 * Check if a role has admin privileges
 */
export function isAdmin(role: ProviderRole | DeveloperRole): boolean {
  return role === PROVIDER_ROLES.ADMIN;
}

/**
 * Check if a role has write access to a resource
 */
export function canWrite(role: ProviderRole | DeveloperRole, resource: 'federation' | 'monetization' | 'billing' | 'branding' | 'provisioning' | 'leads'): boolean {
  switch (resource) {
    case 'federation':
      return hasPermission(role, PERMISSIONS.FEDERATION_WRITE);
    case 'monetization':
      return hasPermission(role, PERMISSIONS.MONETIZATION_WRITE);
    case 'billing':
      return hasPermission(role, PERMISSIONS.BILLING_MANAGE);
    case 'branding':
      return hasPermission(role, PERMISSIONS.BRANDING_MANAGE);
    case 'provisioning':
      return hasPermission(role, PERMISSIONS.PROVISIONING_MANAGE);
    case 'leads':
      return hasPermission(role, PERMISSIONS.LEADS_MANAGE);
    default:
      return false;
  }
}


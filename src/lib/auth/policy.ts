/**
 * Module: Auth Policy
 * Purpose: Space and role mapping for access control
 * Scope: System-wide authentication policy definitions
 * Notes: Codex Phase 1 - Centralized policy configuration
 */

// GUARD: Space-based access control definitions

export type UserSpace = 'client' | 'provider' | 'developer' | 'accountant';
export type UserRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'EMPLOYEE' | 'PROVIDER' | 'DEVELOPER' | 'ACCOUNTANT';

/**
 * Space-to-role mapping
 * Defines which roles are valid in each space
 */
export const SPACE_ROLES: Record<UserSpace, UserRole[]> = {
  client: ['OWNER', 'MANAGER', 'STAFF', 'EMPLOYEE'],
  provider: ['PROVIDER'],
  developer: ['DEVELOPER'],
  accountant: ['ACCOUNTANT'],
};

/**
 * Route prefix to space mapping
 * Used by middleware to determine required space for a route
 */
export const ROUTE_SPACE_MAP: Record<string, UserSpace> = {
  '/client': 'client',
  '/tenant': 'client', // Tenant routes are client space
  '/provider': 'provider',
  '/dev': 'developer',
  '/developer': 'developer',
  '/accountant': 'accountant',
  '/accounting': 'accountant',
};

/**
 * API route prefix to space mapping
 */
export const API_SPACE_MAP: Record<string, UserSpace> = {
  '/api/client': 'client',
  '/api/tenant': 'client',
  '/api/provider': 'provider',
  '/api/dev': 'developer',
  '/api/developer': 'developer',
  '/api/accountant': 'accountant',
};

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
  '/api/health',
  '/api/webhooks',
];

/**
 * Check if a route is public
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path.startsWith(route));
}

/**
 * Get required space for a route
 */
export function getRequiredSpace(path: string): UserSpace | null {
  // Check page routes
  for (const [prefix, space] of Object.entries(ROUTE_SPACE_MAP)) {
    if (path.startsWith(prefix)) {
      return space;
    }
  }
  
  // Check API routes
  for (const [prefix, space] of Object.entries(API_SPACE_MAP)) {
    if (path.startsWith(prefix)) {
      return space;
    }
  }
  
  return null;
}

/**
 * Check if a role is valid for a space
 */
export function isRoleValidForSpace(role: UserRole, space: UserSpace): boolean {
  return SPACE_ROLES[space]?.includes(role) ?? false;
}

/**
 * Get default redirect for a space
 */
export function getSpaceDefaultRedirect(space: UserSpace): string {
  switch (space) {
    case 'provider':
      return '/provider/dashboard';
    case 'developer':
      return '/developer/dashboard';
    case 'accountant':
      return '/accountant/dashboard';
    case 'client':
    default:
      return '/client/dashboard';
  }
}

/**
 * Policy check result
 */
export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
}

/**
 * Check if access is allowed based on policy
 */
export function checkPolicy(
  currentSpace: UserSpace | null,
  currentRole: UserRole | null,
  requiredSpace: UserSpace | null,
  requiredRoles?: UserRole[]
): PolicyCheckResult {
  // If no space requirement, allow
  if (!requiredSpace) {
    return { allowed: true };
  }
  
  // If no current space, deny
  if (!currentSpace) {
    return {
      allowed: false,
      reason: 'No authenticated space',
      redirectTo: '/login',
    };
  }
  
  // Check space match
  if (currentSpace !== requiredSpace) {
    return {
      allowed: false,
      reason: `Wrong space: ${currentSpace} !== ${requiredSpace}`,
      redirectTo: getSpaceDefaultRedirect(currentSpace),
    };
  }
  
  // Check role if specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (!currentRole) {
      return {
        allowed: false,
        reason: 'No role found',
        redirectTo: getSpaceDefaultRedirect(currentSpace),
      };
    }
    
    if (!requiredRoles.includes(currentRole)) {
      return {
        allowed: false,
        reason: `Insufficient role: ${currentRole} not in [${requiredRoles.join(', ')}]`,
        redirectTo: getSpaceDefaultRedirect(currentSpace),
      };
    }
  }
  
  // Validate role is appropriate for space
  if (currentRole && !isRoleValidForSpace(currentRole, currentSpace)) {
    return {
      allowed: false,
      reason: `Invalid role ${currentRole} for space ${currentSpace}`,
      redirectTo: '/login',
    };
  }
  
  return { allowed: true };
}

/**
 * Space guard configuration
 */
export interface SpaceGuardConfig {
  allowedSpaces: UserSpace[];
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Predefined guard configurations
 */
export const GUARDS = {
  CLIENT_ONLY: {
    allowedSpaces: ['client'],
    requireAuth: true,
  } as SpaceGuardConfig,
  
  PROVIDER_ONLY: {
    allowedSpaces: ['provider'],
    allowedRoles: ['PROVIDER'],
    requireAuth: true,
  } as SpaceGuardConfig,
  
  DEVELOPER_ONLY: {
    allowedSpaces: ['developer'],
    allowedRoles: ['DEVELOPER'],
    requireAuth: true,
  } as SpaceGuardConfig,
  
  ACCOUNTANT_ONLY: {
    allowedSpaces: ['accountant'],
    allowedRoles: ['ACCOUNTANT'],
    requireAuth: true,
  } as SpaceGuardConfig,
  
  OWNER_ONLY: {
    allowedSpaces: ['client'],
    allowedRoles: ['OWNER'],
    requireAuth: true,
  } as SpaceGuardConfig,
  
  MANAGER_PLUS: {
    allowedSpaces: ['client'],
    allowedRoles: ['OWNER', 'MANAGER'],
    requireAuth: true,
  } as SpaceGuardConfig,
  
  STAFF_PLUS: {
    allowedSpaces: ['client'],
    allowedRoles: ['OWNER', 'MANAGER', 'STAFF'],
    requireAuth: true,
  } as SpaceGuardConfig,
};

// PR-CHECKS:
// - [x] Space and role definitions centralized
// - [x] Policy check logic implemented
// - [x] Route-to-space mapping defined
// - [x] Predefined guard configurations


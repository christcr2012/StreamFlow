/**
 * Authentication Context Helpers (Tenant-App)
 *
 * @deprecated This file now re-exports from @cortiware/auth-service for backward compatibility.
 * New code should import directly from '@cortiware/auth-service'.
 *
 * Detects and manages authentication context:
 * - Normal mode: User authenticated via SSO or direct login
 * - Direct Access mode: Provider/Developer authenticated via emergency endpoint
 */

import {
  getAuthContext as getAuthContextShared,
  isDirectAccessMode as isDirectAccessModeShared,
  requireAuth as requireAuthShared,
  requireRole as requireRoleShared,
  type AuthMode,
  type AuthRole,
  type AuthContext,
} from '@cortiware/auth-service';
import { prisma } from './prisma';

// Re-export types for backward compatibility
export type { AuthMode, AuthRole, AuthContext };

/**
 * Get current authentication context from cookies
 *
 * @deprecated Import from '@cortiware/auth-service' instead
 */
export async function getAuthContext(): Promise<AuthContext> {
  return getAuthContextShared({ prisma });
}

/**
 * Check if current user is in direct access mode
 *
 * @deprecated Import from '@cortiware/auth-service' instead
 */
export async function isDirectAccessMode(): Promise<boolean> {
  return isDirectAccessModeShared({ prisma });
}

/**
 * Require authentication - redirect to login if not authenticated
 *
 * @deprecated Import from '@cortiware/auth-service' instead
 */
export async function requireAuth(): Promise<AuthContext> {
  return requireAuthShared({ prisma });
}

/**
 * Require specific role - throw error if not authorized
 *
 * @deprecated Import from '@cortiware/auth-service' instead
 */
export async function requireRole(allowedRoles: AuthRole[]): Promise<AuthContext> {
  return requireRoleShared(allowedRoles, { prisma });
}


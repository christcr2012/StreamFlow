/**
 * 🛡️ SPACE & ROLE GUARDS
 * 
 * Page and API guards by space and role for GitHub issue #2
 * Acceptance Criteria: Direct hits to wrong space are redirected/403; audit entry created.
 * Phase:0 Area:auth Priority:high
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { GetServerSidePropsContext } from 'next';
import { consolidatedAudit } from '@/lib/consolidated-audit';

export type UserSpace = 'client' | 'provider' | 'developer' | 'accountant';
export type UserRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'PROVIDER' | 'DEVELOPER' | 'ACCOUNTANT' | 'VIEWER';

export interface SpaceGuardConfig {
  allowedSpaces: UserSpace[];
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
}

export interface GuardResult {
  allowed: boolean;
  redirectTo?: string;
  statusCode?: number;
  error?: string;
}

/**
 * Determine current user space from request cookies
 */
export function getCurrentSpace(req: NextApiRequest | GetServerSidePropsContext['req']): UserSpace | null {
  const cookies = req.cookies;
  
  if (cookies.ws_provider) return 'provider';
  if (cookies.ws_developer) return 'developer';
  if (cookies.ws_accountant) return 'accountant';
  if (cookies.ws_user) return 'client';
  
  return null;
}

/**
 * Get user role from /api/me endpoint
 */
async function getUserRole(req: NextApiRequest | GetServerSidePropsContext['req']): Promise<UserRole | null> {
  try {
    // For API routes, we can make internal calls
    // For SSR, we need to reconstruct the user data
    const currentSpace = getCurrentSpace(req);
    if (!currentSpace) return null;

    // Simple role determination based on space and cookies
    // This is a simplified version - in production you'd want to validate against the database
    if (currentSpace === 'provider') return 'PROVIDER';
    if (currentSpace === 'developer') return 'DEVELOPER';
    if (currentSpace === 'accountant') return 'ACCOUNTANT';
    
    // For client space, we'd need to check the database
    // For now, return a default role
    return 'VIEWER';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Create audit log entry for access attempt using consolidated audit system
 */
async function auditAccessAttempt(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  path: string,
  currentSpace: UserSpace | null,
  currentRole: UserRole | null,
  allowed: boolean,
  reason: string
) {
  try {
    const context = consolidatedAudit.extractContext(req as NextApiRequest);

    if (allowed) {
      await consolidatedAudit.logSystemAdmin(
        `Space guard check: ${path}`,
        'system', // We don't have email in this context
        currentSpace === 'provider' ? 'PROVIDER' :
        currentSpace === 'developer' ? 'DEVELOPER' :
        currentSpace === 'accountant' ? 'ACCOUNTANT' : 'CLIENT',
        'ROUTE_ACCESS',
        context,
        {
          path,
          currentSpace,
          currentRole,
          allowed,
          reason
        }
      );
    } else {
      await consolidatedAudit.logSecurity(
        'CROSS_SYSTEM_ACCESS',
        'system',
        currentSpace === 'provider' ? 'PROVIDER' :
        currentSpace === 'developer' ? 'DEVELOPER' :
        currentSpace === 'accountant' ? 'ACCOUNTANT' : 'CLIENT',
        `Attempted access to ${path}`,
        context,
        {
          path,
          currentSpace,
          currentRole,
          reason,
          blocked: true
        }
      );
    }
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
  }
}

/**
 * Check if access is allowed based on space and role guards
 */
export async function checkSpaceAccess(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  path: string,
  config: SpaceGuardConfig
): Promise<GuardResult> {
  const currentSpace = getCurrentSpace(req);
  const currentRole = await getUserRole(req);

  // Check authentication requirement
  if (config.requireAuth !== false && !currentSpace) {
    await auditAccessAttempt(req, path, currentSpace, currentRole, false, 'No authentication');
    return {
      allowed: false,
      redirectTo: '/login',
      statusCode: 401,
      error: 'Authentication required'
    };
  }

  // Check space access
  if (currentSpace && !config.allowedSpaces.includes(currentSpace)) {
    await auditAccessAttempt(req, path, currentSpace, currentRole, false, `Space ${currentSpace} not allowed`);
    
    // Determine redirect based on current space
    const redirectTo = config.redirectTo || getDefaultRedirectForSpace(currentSpace);
    
    return {
      allowed: false,
      redirectTo,
      statusCode: 403,
      error: `Access denied: ${currentSpace} space not allowed for this resource`
    };
  }

  // Check role access if specified
  if (config.allowedRoles && currentRole && !config.allowedRoles.includes(currentRole)) {
    await auditAccessAttempt(req, path, currentSpace, currentRole, false, `Role ${currentRole} not allowed`);
    
    return {
      allowed: false,
      statusCode: 403,
      error: `Access denied: ${currentRole} role not allowed for this resource`
    };
  }

  // Access allowed
  await auditAccessAttempt(req, path, currentSpace, currentRole, true, 'Access granted');
  
  return {
    allowed: true
  };
}

/**
 * Get default redirect URL for a space
 */
function getDefaultRedirectForSpace(space: UserSpace): string {
  switch (space) {
    case 'provider':
      return '/provider/dashboard';
    case 'developer':
      return '/dev/system';
    case 'accountant':
      return '/accountant';
    case 'client':
    default:
      return '/dashboard';
  }
}

/**
 * API Route Guard - Use in API routes to protect endpoints
 */
export function withSpaceGuard(config: SpaceGuardConfig) {
  return function (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
    return async function guardedHandler(req: NextApiRequest, res: NextApiResponse) {
      const result = await checkSpaceAccess(req, req.url || 'unknown', config);
      
      if (!result.allowed) {
        return res.status(result.statusCode || 403).json({
          error: result.error || 'Access denied',
          redirectTo: result.redirectTo
        });
      }
      
      return handler(req, res);
    };
  };
}

/**
 * Page Guard - Use in getServerSideProps to protect pages
 */
export async function withPageGuard(
  context: GetServerSidePropsContext,
  config: SpaceGuardConfig
) {
  const result = await checkSpaceAccess(context.req, context.resolvedUrl, config);
  
  if (!result.allowed) {
    if (result.redirectTo) {
      return {
        redirect: {
          destination: result.redirectTo,
          permanent: false,
        },
      };
    } else {
      return {
        notFound: true,
      };
    }
  }
  
  return null; // Allow access
}

/**
 * Predefined guard configurations for common scenarios
 */
export const SPACE_GUARDS = {
  CLIENT_ONLY: {
    allowedSpaces: ['client'],
    requireAuth: true
  },
  PROVIDER_ONLY: {
    allowedSpaces: ['provider'],
    requireAuth: true
  },
  DEVELOPER_ONLY: {
    allowedSpaces: ['developer'],
    requireAuth: true
  },
  ACCOUNTANT_ONLY: {
    allowedSpaces: ['accountant'],
    requireAuth: true
  },
  ADMIN_SPACES: {
    allowedSpaces: ['provider', 'developer'],
    requireAuth: true
  },
  OWNER_ONLY: {
    allowedSpaces: ['client'],
    allowedRoles: ['OWNER'],
    requireAuth: true
  },
  MANAGER_PLUS: {
    allowedSpaces: ['client'],
    allowedRoles: ['OWNER', 'MANAGER'],
    requireAuth: true
  }
} satisfies Record<string, SpaceGuardConfig>;

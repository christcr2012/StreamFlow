/**
 * Module: Auth Guard
 * Purpose: Server-side authentication and authorization guards
 * Scope: API routes and SSR pages
 * Notes: Codex Phase 1 - requirePolicy, requirePerm, getSession
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { GetServerSidePropsContext } from 'next';
import { checkPolicy, type UserSpace, type UserRole, type SpaceGuardConfig } from './policy';
import { consolidatedAudit } from '@/lib/consolidated-audit';

// GUARD: Server-side authentication enforcement

/**
 * Session data structure
 */
export interface Session {
  id: string;
  email: string;
  name?: string;
  orgId: string;
  tenantId?: string;
  space: UserSpace;
  roles: UserRole[];
  baseRole?: UserRole;
  perms?: string[];
  isOwner?: boolean;
  isProvider?: boolean;
}

/**
 * Get current user space from cookies
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
 * Get session from /api/me endpoint
 * This is the canonical way to get user session data
 */
export async function getSession(req: NextApiRequest | GetServerSidePropsContext['req']): Promise<Session | null> {
  try {
    const currentSpace = getCurrentSpace(req);
    if (!currentSpace) return null;

    // For API routes, we can make an internal fetch to /api/me
    // For SSR, we need to construct the URL properly
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    // Forward cookies to /api/me
    const cookieHeader = Object.entries(req.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    const response = await fetch(`${baseUrl}/api/me`, {
      headers: {
        cookie: cookieHeader,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Transform /api/me response to Session format
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      orgId: data.orgId,
      tenantId: data.tenantId,
      space: data.space,
      roles: data.roles || [],
      baseRole: data.baseRole,
      perms: data.perms,
      isOwner: data.isOwner,
      isProvider: data.isProvider,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Require policy check for API routes
 * Returns 403 if policy check fails
 */
export function requirePolicy(config: SpaceGuardConfig) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>
  ) => {
    const session = await getSession(req);
    const currentSpace = getCurrentSpace(req);
    const currentRole = session?.baseRole || null;
    
    // Check if authentication is required
    if (config.requireAuth && !session) {
      await auditAccessDenied(req, 'No session', currentSpace, currentRole);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if space is allowed
    if (!currentSpace || !config.allowedSpaces.includes(currentSpace)) {
      await auditAccessDenied(req, 'Wrong space', currentSpace, currentRole);
      return res.status(403).json({ error: 'Forbidden - wrong space' });
    }
    
    // Check if role is allowed (if specified)
    if (config.allowedRoles && config.allowedRoles.length > 0) {
      if (!currentRole || !config.allowedRoles.includes(currentRole)) {
        await auditAccessDenied(req, 'Insufficient role', currentSpace, currentRole);
        return res.status(403).json({ error: 'Forbidden - insufficient role' });
      }
    }
    
    // Policy check passed
    await auditAccessGranted(req, currentSpace, currentRole);
    await next();
  };
}

/**
 * Require permission check for API routes
 * Returns 403 if permission check fails
 */
export function requirePerm(permission: string) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>
  ) => {
    const session = await getSession(req);
    
    if (!session) {
      await auditAccessDenied(req, 'No session', null, null);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user has the required permission
    if (!session.perms || !session.perms.includes(permission)) {
      await auditAccessDenied(req, `Missing permission: ${permission}`, session.space, session.baseRole ?? null);
      return res.status(403).json({ error: `Forbidden - missing permission: ${permission}` });
    }

    // Permission check passed
    await auditAccessGranted(req, session.space, session.baseRole ?? null);
    await next();
  };
}

/**
 * Audit access granted
 */
async function auditAccessGranted(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  space: UserSpace | null,
  role: UserRole | null
) {
  try {
    const context = consolidatedAudit.extractContext(req as NextApiRequest);
    
    await consolidatedAudit.logSystemAdmin(
      `Access granted: ${req.url}`,
      'system',
      space === 'provider' ? 'PROVIDER' :
      space === 'developer' ? 'DEVELOPER' :
      space === 'accountant' ? 'ACCOUNTANT' : 'CLIENT',
      'ROUTE_ACCESS',
      context,
      {
        path: req.url,
        space,
        role,
        allowed: true,
      }
    );
  } catch (error) {
    console.error('Error auditing access granted:', error);
  }
}

/**
 * Audit access denied
 */
async function auditAccessDenied(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  reason: string,
  space: UserSpace | null,
  role: UserRole | null
) {
  try {
    const context = consolidatedAudit.extractContext(req as NextApiRequest);

    await consolidatedAudit.logSecurity(
      'PERMISSION_DENIED',
      'system',
      space === 'provider' ? 'PROVIDER' :
      space === 'developer' ? 'DEVELOPER' :
      space === 'accountant' ? 'ACCOUNTANT' : 'CLIENT',
      `Access denied: ${req.url}`,
      context,
      {
        path: req.url,
        space,
        role,
        reason,
        allowed: false,
      }
    );
  } catch (error) {
    console.error('Error auditing access denied:', error);
  }
}

/**
 * Wrapper for API routes with guard
 * Usage: export default withGuard(GUARDS.CLIENT_ONLY, handler);
 */
export function withGuard(
  config: SpaceGuardConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await requirePolicy(config)(req, res, async () => {
      await handler(req, res);
    });
  };
}

/**
 * Wrapper for API routes with permission check
 * Usage: export default withPermission('leads.create', handler);
 */
export function withPermission(
  permission: string,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await requirePerm(permission)(req, res, async () => {
      await handler(req, res);
    });
  };
}

/**
 * Get session for SSR pages
 * Returns null if not authenticated
 */
export async function getServerSession(context: GetServerSidePropsContext): Promise<Session | null> {
  return getSession(context.req);
}

/**
 * Require authentication for SSR pages
 * Redirects to login if not authenticated
 */
export async function requireAuth(context: GetServerSidePropsContext) {
  const session = await getServerSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      session,
    },
  };
}

/**
 * Require space for SSR pages
 * Redirects if wrong space
 */
export async function requireSpace(context: GetServerSidePropsContext, allowedSpaces: UserSpace[]) {
  const session = await getServerSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  if (!allowedSpaces.includes(session.space)) {
    return {
      redirect: {
        destination: `/${session.space}/dashboard`,
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      session,
    },
  };
}

// PR-CHECKS:
// - [x] getSession implemented
// - [x] requirePolicy implemented
// - [x] requirePerm implemented
// - [x] Audit logging for access attempts
// - [x] SSR helpers (requireAuth, requireSpace)


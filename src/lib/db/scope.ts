/**
 * Module: DB Scope Helpers
 * Purpose: Tenant scoping utilities for Prisma queries
 * Scope: Database layer - automatic orgId injection
 * Notes: Codex Phase 2 - tenantWhere and assertTenant helpers
 */

import type { NextApiRequest } from 'next';
import { getSession, type Session } from '@/lib/auth/guard';

// GUARD: Tenant scoping enforcement

/**
 * Tenant scope error
 */
export class TenantScopeError extends Error {
  constructor(message: string, public code: string = 'TENANT_SCOPE_VIOLATION') {
    super(message);
    this.name = 'TenantScopeError';
  }
}

/**
 * Get tenant where clause for Prisma queries
 * Usage: await prisma.lead.findMany({ where: tenantWhere(session) })
 */
export function tenantWhere(session: Session | null): { orgId: string } {
  if (!session) {
    throw new TenantScopeError('No session provided', 'NO_SESSION');
  }
  
  if (!session.orgId) {
    throw new TenantScopeError('Session has no orgId', 'NO_ORG_ID');
  }
  
  return { orgId: session.orgId };
}

/**
 * Assert that an entity belongs to the session's tenant
 * Usage: assertTenant(session, lead);
 */
export function assertTenant(session: Session | null, entity: { orgId?: string | null } | null): void {
  if (!session) {
    throw new TenantScopeError('No session provided', 'NO_SESSION');
  }
  
  if (!session.orgId) {
    throw new TenantScopeError('Session has no orgId', 'NO_ORG_ID');
  }
  
  if (!entity) {
    throw new TenantScopeError('Entity is null', 'NULL_ENTITY');
  }
  
  if (!entity.orgId) {
    throw new TenantScopeError('Entity has no orgId', 'NO_ENTITY_ORG_ID');
  }
  
  if (entity.orgId !== session.orgId) {
    throw new TenantScopeError(
      `Cross-tenant access denied: entity.orgId=${entity.orgId}, session.orgId=${session.orgId}`,
      'CROSS_TENANT_ACCESS'
    );
  }
}

/**
 * Get tenant context from request
 * Returns orgId for use in queries
 */
export async function getTenantOrgId(req: NextApiRequest): Promise<string> {
  const session = await getSession(req);
  
  if (!session) {
    throw new TenantScopeError('No authenticated session', 'NO_AUTH');
  }
  
  if (!session.orgId) {
    throw new TenantScopeError('Session has no orgId', 'NO_ORG_ID');
  }
  
  return session.orgId;
}

/**
 * Merge tenant where clause with additional conditions
 * Usage: await prisma.lead.findMany({ where: mergeWhere(session, { status: 'active' }) })
 */
export function mergeWhere<T extends Record<string, any>>(
  session: Session | null,
  additionalWhere?: T
): T & { orgId: string } {
  const baseWhere = tenantWhere(session);
  
  if (!additionalWhere) {
    return baseWhere as T & { orgId: string };
  }
  
  return {
    ...additionalWhere,
    ...baseWhere,
  };
}

/**
 * Validate that data being created/updated has correct orgId
 * Usage: validateTenantData(session, { name: 'Test', orgId: 'org_123' })
 */
export function validateTenantData(
  session: Session | null,
  data: { orgId?: string | null } | null
): void {
  if (!session) {
    throw new TenantScopeError('No session provided', 'NO_SESSION');
  }
  
  if (!session.orgId) {
    throw new TenantScopeError('Session has no orgId', 'NO_ORG_ID');
  }
  
  if (!data) {
    return; // Allow null data (will be handled by caller)
  }
  
  // If orgId is provided in data, it must match session orgId
  if (data.orgId && data.orgId !== session.orgId) {
    throw new TenantScopeError(
      `Data orgId mismatch: data.orgId=${data.orgId}, session.orgId=${session.orgId}`,
      'ORG_ID_MISMATCH'
    );
  }
}

/**
 * Inject orgId into data for create/update operations
 * Usage: const dataWithOrgId = injectOrgId(session, { name: 'Test' })
 */
export function injectOrgId<T extends Record<string, any>>(
  session: Session | null,
  data: T
): T & { orgId: string } {
  if (!session) {
    throw new TenantScopeError('No session provided', 'NO_SESSION');
  }
  
  if (!session.orgId) {
    throw new TenantScopeError('Session has no orgId', 'NO_ORG_ID');
  }
  
  // Validate if orgId already exists
  if ('orgId' in data && data.orgId !== session.orgId) {
    throw new TenantScopeError(
      `Data orgId mismatch: data.orgId=${data.orgId}, session.orgId=${session.orgId}`,
      'ORG_ID_MISMATCH'
    );
  }
  
  return {
    ...data,
    orgId: session.orgId,
  };
}

/**
 * Wrapper for API handlers that automatically provides tenant-scoped session
 * Usage:
 * export default withTenantScope(async (req, res, session) => {
 *   const leads = await prisma.lead.findMany({ where: tenantWhere(session) });
 *   res.json(leads);
 * });
 */
export function withTenantScope(
  handler: (req: NextApiRequest, res: any, session: Session) => Promise<void>
) {
  return async (req: NextApiRequest, res: any) => {
    try {
      const session = await getSession(req);
      
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!session.orgId) {
        return res.status(403).json({ error: 'No organization context' });
      }
      
      await handler(req, res, session);
    } catch (error) {
      if (error instanceof TenantScopeError) {
        console.error('Tenant scope error:', error.message);
        return res.status(403).json({ error: error.message, code: error.code });
      }
      
      console.error('Unexpected error in withTenantScope:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Check if user has access to multiple orgs (for provider/developer)
 * Returns true if user can access cross-tenant data
 */
export function canAccessMultipleOrgs(session: Session | null): boolean {
  if (!session) return false;
  
  // Provider and Developer can access multiple orgs
  return session.space === 'provider' || session.space === 'developer';
}

/**
 * Get list of accessible orgIds for a session
 * For client users: returns [session.orgId]
 * For provider/developer: returns all orgIds (or specific list if needed)
 */
export async function getAccessibleOrgIds(session: Session | null): Promise<string[]> {
  if (!session) {
    return [];
  }
  
  // Client users can only access their own org
  if (session.space === 'client') {
    return session.orgId ? [session.orgId] : [];
  }
  
  // Provider and Developer can access all orgs
  // In production, you might want to query the database for the actual list
  // For now, we return empty array to indicate "all orgs" access
  // The caller should handle this appropriately
  return [];
}

// PR-CHECKS:
// - [x] tenantWhere helper implemented
// - [x] assertTenant helper implemented
// - [x] orgId scoping enforced
// - [x] Cross-tenant access denied
// - [x] withTenantScope wrapper for API handlers


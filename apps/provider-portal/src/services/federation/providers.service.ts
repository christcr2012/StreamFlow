// Federation Provider Services (Prisma-backed)
// Provides cross-tenant read access for provider portal

import { prisma } from '@/lib/prisma';
import { checkEntitlement, type FederationRole } from '@/lib/entitlements';
import { logFederationAudit } from '@/lib/federation-audit';

export type TenantSummary = {
  id: string;
  name: string;
  createdAt: string;
  userCount?: number;
  status?: string;
};

export interface ProviderFederationService {
  listTenants(params: { cursor?: string; limit?: number; actor?: string; role?: FederationRole }): Promise<{ items: TenantSummary[]; nextCursor: string | null }>;
  getTenant(id: string, actor?: string, role?: FederationRole): Promise<TenantSummary | null>;
}

export const providerFederationService: ProviderFederationService = {
  async listTenants(params) {
    const { actor = 'unknown', role = 'provider-viewer' } = params;

    // Enforce entitlements
    try {
      checkEntitlement(role, 'tenants:list');
    } catch (error) {
      await logFederationAudit({
        actor,
        action: 'tenants:list',
        result: 'forbidden',
        metadata: { role },
      });
      throw error;
    }

    const limit = Math.min(params.limit || 10, 100);
    const cursor = params.cursor;

    // PERFORMANCE: Query orgs with cursor pagination using id (prevents data skipping)
    const orgs = await prisma.org.findMany({
      where: cursor ? { id: { lt: cursor } } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
    });

    const hasMore = orgs.length > limit;
    const items = orgs.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Log audit event
    await logFederationAudit({
      actor,
      action: 'tenants:list',
      result: 'success',
      metadata: { count: items.length, cursor, limit },
    });

    return {
      items: items.map((org: any) => ({
        id: org.id,
        name: org.name,
        createdAt: org.createdAt.toISOString(),
        userCount: org._count.users,
      })),
      nextCursor,
    };
  },

  async getTenant(id, actor = 'unknown', role = 'provider-viewer') {
    // Enforce entitlements
    try {
      checkEntitlement(role, 'tenants:read');
    } catch (error) {
      await logFederationAudit({
        actor,
        action: 'tenants:read',
        resource: id,
        result: 'forbidden',
        metadata: { role },
      });
      throw error;
    }

    const org = await prisma.org.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
    });

    // Log audit event
    await logFederationAudit({
      actor,
      action: 'tenants:read',
      resource: id,
      result: org ? 'success' : 'error',
      metadata: { found: !!org },
    });

    if (!org) return null;

    return {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt.toISOString(),
      userCount: org._count.users,
    };
  },
};


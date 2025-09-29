/**
 * 🏢 TENANT SCOPE HELPER FOR PRISMA
 * 
 * Tenant scope helper for Prisma for GitHub issue #3
 * Acceptance Criteria: All queries include orgId; updates assert entity.orgId === session.orgId.
 * Phase:0 Area:db Priority:high
 */

import type { NextApiRequest } from 'next';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export interface TenantContext {
  orgId: string;
  userId: string;
  userEmail: string;
}

export class TenantScopeError extends Error {
  constructor(message: string, public code: string = 'TENANT_SCOPE_VIOLATION') {
    super(message);
    this.name = 'TenantScopeError';
  }
}

/**
 * Get tenant context from authenticated request
 */
export async function getTenantContext(req: NextApiRequest): Promise<TenantContext> {
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    throw new TenantScopeError('No authenticated user found', 'NO_AUTH');
  }
  
  if (!user.orgId) {
    throw new TenantScopeError('User has no organization context', 'NO_ORG');
  }
  
  return {
    orgId: user.orgId,
    userId: user.id,
    userEmail: user.email
  };
}

/**
 * Tenant-scoped Prisma client wrapper
 * Automatically adds orgId to all queries and validates updates
 */
export class TenantScopedPrisma {
  private orgId: string;
  private userId: string;
  private userEmail: string;

  constructor(context: TenantContext) {
    this.orgId = context.orgId;
    this.userId = context.userId;
    this.userEmail = context.userEmail;
  }

  /**
   * Create a new record with automatic orgId injection
   */
  async create<T = any>(
    model: keyof typeof prisma,
    args: {
      data: any;
      select?: any;
      include?: any;
    }
  ): Promise<T> {
    // Ensure orgId is set to the tenant's orgId
    const createData = {
      ...args.data,
      orgId: this.orgId
    };

    // Validate that if orgId was provided, it matches the tenant's orgId
    if (args.data.orgId && args.data.orgId !== this.orgId) {
      throw new TenantScopeError(
        `Attempted to create record with orgId ${args.data.orgId} but user belongs to ${this.orgId}`,
        'ORG_MISMATCH'
      );
    }

    return (prisma[model] as any).create({
      data: createData,
      select: args.select,
      include: args.include
    });
  }

  /**
   * Find records with automatic orgId scoping
   */
  async findMany<T>(
    model: keyof typeof prisma,
    args: any = {}
  ): Promise<T[]> {
    const scopedArgs = {
      ...args,
      where: {
        ...args.where,
        orgId: this.orgId
      }
    };

    return (prisma[model] as any).findMany(scopedArgs);
  }

  /**
   * Find unique record with automatic orgId scoping
   */
  async findUnique<T>(
    model: keyof typeof prisma,
    args: any
  ): Promise<T | null> {
    const scopedArgs = {
      ...args,
      where: {
        ...args.where,
        orgId: this.orgId
      }
    };

    return (prisma[model] as any).findUnique(scopedArgs);
  }

  /**
   * Find first record with automatic orgId scoping
   */
  async findFirst<T>(
    model: keyof typeof prisma,
    args: any = {}
  ): Promise<T | null> {
    const scopedArgs = {
      ...args,
      where: {
        ...args.where,
        orgId: this.orgId
      }
    };

    return (prisma[model] as any).findFirst(scopedArgs);
  }

  /**
   * Update record with tenant validation
   */
  async update<T extends { orgId: string }>(
    model: keyof typeof prisma,
    args: {
      where: any;
      data: Partial<T>;
    }
  ): Promise<T> {
    // First, verify the record exists and belongs to this tenant
    const existing = await (prisma[model] as any).findUnique({
      where: args.where,
      select: { orgId: true }
    });

    if (!existing) {
      throw new TenantScopeError(
        `Record not found in model ${String(model)}`,
        'RECORD_NOT_FOUND'
      );
    }

    if (existing.orgId !== this.orgId) {
      throw new TenantScopeError(
        `Attempted to update record with orgId ${existing.orgId} but user belongs to ${this.orgId}`,
        'ORG_MISMATCH'
      );
    }

    // Ensure the update data doesn't change the orgId
    if (args.data.orgId && args.data.orgId !== this.orgId) {
      throw new TenantScopeError(
        `Attempted to change orgId from ${this.orgId} to ${args.data.orgId}`,
        'ORG_CHANGE_DENIED'
      );
    }

    return (prisma[model] as any).update(args);
  }

  /**
   * Update many records with tenant validation
   */
  async updateMany<T>(
    model: keyof typeof prisma,
    args: {
      where: any;
      data: Partial<T>;
    }
  ): Promise<{ count: number }> {
    // Scope the where clause to this tenant
    const scopedArgs = {
      ...args,
      where: {
        ...args.where,
        orgId: this.orgId
      }
    };

    // Ensure the update data doesn't change the orgId
    if ((args.data as any).orgId && (args.data as any).orgId !== this.orgId) {
      throw new TenantScopeError(
        `Attempted to change orgId to ${(args.data as any).orgId}`,
        'ORG_CHANGE_DENIED'
      );
    }

    return (prisma[model] as any).updateMany(scopedArgs);
  }

  /**
   * Delete record with tenant validation
   */
  async delete<T>(
    model: keyof typeof prisma,
    args: { where: any }
  ): Promise<T> {
    // First, verify the record exists and belongs to this tenant
    const existing = await (prisma[model] as any).findUnique({
      where: args.where,
      select: { orgId: true }
    });

    if (!existing) {
      throw new TenantScopeError(
        `Record not found in model ${String(model)}`,
        'RECORD_NOT_FOUND'
      );
    }

    if (existing.orgId !== this.orgId) {
      throw new TenantScopeError(
        `Attempted to delete record with orgId ${existing.orgId} but user belongs to ${this.orgId}`,
        'ORG_MISMATCH'
      );
    }

    return (prisma[model] as any).delete(args);
  }

  /**
   * Delete many records with tenant scoping
   */
  async deleteMany<T>(
    model: keyof typeof prisma,
    args: { where: any } = { where: {} }
  ): Promise<{ count: number }> {
    // Scope the where clause to this tenant
    const scopedArgs = {
      ...args,
      where: {
        ...args.where,
        orgId: this.orgId
      }
    };

    return (prisma[model] as any).deleteMany(scopedArgs);
  }

  /**
   * Count records with automatic orgId scoping
   */
  async count(
    model: keyof typeof prisma,
    args: any = {}
  ): Promise<number> {
    const scopedArgs = {
      ...args,
      where: {
        ...args.where,
        orgId: this.orgId
      }
    };

    return (prisma[model] as any).count(scopedArgs);
  }

  /**
   * Get the tenant's orgId
   */
  getOrgId(): string {
    return this.orgId;
  }

  /**
   * Get the user's ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Get the user's email
   */
  getUserEmail(): string {
    return this.userEmail;
  }
}

/**
 * Create a tenant-scoped Prisma client from a request
 */
export async function createTenantScopedPrisma(req: NextApiRequest): Promise<TenantScopedPrisma> {
  const context = await getTenantContext(req);
  return new TenantScopedPrisma(context);
}

/**
 * Convenience function to wrap API handlers with tenant scoping
 */
export function withTenantScope<T = any>(
  handler: (req: NextApiRequest, res: any, tenantPrisma: TenantScopedPrisma) => Promise<T>
) {
  return async function tenantScopedHandler(req: NextApiRequest, res: any): Promise<T> {
    try {
      const tenantPrisma = await createTenantScopedPrisma(req);
      return await handler(req, res, tenantPrisma);
    } catch (error) {
      if (error instanceof TenantScopeError) {
        return res.status(403).json({
          error: error.message,
          code: error.code
        });
      }
      throw error;
    }
  };
}

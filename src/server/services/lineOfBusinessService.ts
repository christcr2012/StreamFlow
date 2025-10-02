/**
 * Line of Business Service
 * Binder3: Multi-Location Management
 * 
 * Handles CRUD operations for lines of business (vertical packs)
 */

import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit/auditLog';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const CreateLineOfBusinessSchema = z.object({
  buId: z.string().optional(),
  key: z.string().min(1), // e.g., 'cleaning', 'hvac', 'fencing'
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export const UpdateLineOfBusinessSchema = z.object({
  buId: z.string().optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export type CreateLineOfBusinessInput = z.infer<typeof CreateLineOfBusinessSchema>;
export type UpdateLineOfBusinessInput = z.infer<typeof UpdateLineOfBusinessSchema>;

export interface LineOfBusinessResult {
  id: string;
  orgId: string;
  buId: string | null;
  key: string;
  enabled: boolean;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class LineOfBusinessService {
  /**
   * Create/enable a line of business (vertical pack)
   */
  async create(
    orgId: string,
    userId: string,
    input: CreateLineOfBusinessInput
  ): Promise<LineOfBusinessResult> {
    const validated = CreateLineOfBusinessSchema.parse(input);

    // Verify business unit exists if provided
    if (validated.buId) {
      const bu = await prisma.businessUnit.findUnique({
        where: { id: validated.buId },
      });

      if (!bu || bu.orgId !== orgId) {
        throw new Error('Business unit not found');
      }
    }

    // Check for duplicate (use findFirst for nullable unique constraint)
    const existing = await prisma.lineOfBusiness.findFirst({
      where: {
        orgId,
        key: validated.key,
        buId: validated.buId ?? null,
      },
    });

    if (existing) {
      throw new Error('Line of business already exists for this tenant/BU');
    }

    // Create LoB
    const lob = await prisma.lineOfBusiness.create({
      data: {
        orgId,
        buId: validated.buId,
        key: validated.key,
        enabled: validated.enabled ?? false,
        config: (validated.config ?? {}) as any,
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'create',
      resource: `line_of_business:${lob.id}`,
      meta: { key: lob.key, enabled: lob.enabled },
    });

    return lob as LineOfBusinessResult;
  }

  /**
   * Get line of business by ID
   */
  async getById(orgId: string, lobId: string): Promise<LineOfBusinessResult | null> {
    const lob = await prisma.lineOfBusiness.findUnique({
      where: { id: lobId },
    });

    if (!lob || lob.orgId !== orgId) {
      return null;
    }

    return lob as LineOfBusinessResult;
  }

  /**
   * List lines of business for a tenant
   */
  async list(
    orgId: string,
    options: {
      buId?: string;
      enabled?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<LineOfBusinessResult[]> {
    const { buId, enabled, limit = 50, offset = 0 } = options;

    const lobs = await prisma.lineOfBusiness.findMany({
      where: {
        orgId,
        ...(buId !== undefined && { buId }),
        ...(enabled !== undefined && { enabled }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return lobs as LineOfBusinessResult[];
  }

  /**
   * Update line of business
   */
  async update(
    orgId: string,
    userId: string,
    lobId: string,
    input: UpdateLineOfBusinessInput
  ): Promise<LineOfBusinessResult> {
    const validated = UpdateLineOfBusinessSchema.parse(input);

    // Verify LoB exists
    const existing = await this.getById(orgId, lobId);
    if (!existing) {
      throw new Error('Line of business not found');
    }

    // Verify business unit if provided
    if (validated.buId) {
      const bu = await prisma.businessUnit.findUnique({
        where: { id: validated.buId },
      });

      if (!bu || bu.orgId !== orgId) {
        throw new Error('Business unit not found');
      }
    }

    // Update LoB
    const lob = await prisma.lineOfBusiness.update({
      where: { id: lobId },
      data: {
        ...(validated.buId !== undefined && { buId: validated.buId }),
        ...(validated.enabled !== undefined && { enabled: validated.enabled }),
        ...(validated.config !== undefined && { config: validated.config as any }),
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: `line_of_business:${lob.id}`,
      meta: { changes: validated },
    });

    return lob as LineOfBusinessResult;
  }

  /**
   * Delete/disable line of business
   */
  async delete(
    orgId: string,
    userId: string,
    lobId: string
  ): Promise<void> {
    // Verify LoB exists
    const existing = await this.getById(orgId, lobId);
    if (!existing) {
      throw new Error('Line of business not found');
    }

    // Delete LoB
    await prisma.lineOfBusiness.delete({
      where: { id: lobId },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'delete',
      resource: `line_of_business:${lobId}`,
    });
  }

  /**
   * Enable/disable line of business
   */
  async setEnabled(
    orgId: string,
    userId: string,
    lobId: string,
    enabled: boolean
  ): Promise<LineOfBusinessResult> {
    // Verify LoB exists
    const existing = await this.getById(orgId, lobId);
    if (!existing) {
      throw new Error('Line of business not found');
    }

    // Update enabled status
    const lob = await prisma.lineOfBusiness.update({
      where: { id: lobId },
      data: { enabled },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: `line_of_business:${lob.id}`,
      meta: { action: enabled ? 'enable' : 'disable' },
    });

    return lob as LineOfBusinessResult;
  }
}

export const lineOfBusinessService = new LineOfBusinessService();


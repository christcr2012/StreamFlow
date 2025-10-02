/**
 * Business Unit Service
 * Binder3: Multi-Location Management
 * 
 * Handles CRUD operations for business units (locations)
 */

import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit/auditLog';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const CreateBusinessUnitSchema = z.object({
  name: z.string().min(1),
  timezone: z.string().optional(),
  address: z.record(z.unknown()).optional(),
});

export const UpdateBusinessUnitSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().optional(),
  address: z.record(z.unknown()).optional(),
});

export type CreateBusinessUnitInput = z.infer<typeof CreateBusinessUnitSchema>;
export type UpdateBusinessUnitInput = z.infer<typeof UpdateBusinessUnitSchema>;

export interface BusinessUnitResult {
  id: string;
  orgId: string;
  name: string;
  timezone: string;
  address: any;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class BusinessUnitService {
  /**
   * Create a new business unit
   */
  async create(
    orgId: string,
    userId: string,
    input: CreateBusinessUnitInput
  ): Promise<BusinessUnitResult> {
    const validated = CreateBusinessUnitSchema.parse(input);

    // Check for duplicate name
    const existing = await prisma.businessUnit.findUnique({
      where: {
        orgId_name: {
          orgId,
          name: validated.name,
        },
      },
    });

    if (existing) {
      throw new Error('Business unit with this name already exists');
    }

    // Create business unit
    const bu = await prisma.businessUnit.create({
      data: {
        orgId,
        name: validated.name,
        timezone: validated.timezone ?? 'UTC',
        address: validated.address ?? {},
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'create',
      resource: `business_unit:${bu.id}`,
      meta: { name: bu.name, timezone: bu.timezone },
    });

    return bu as BusinessUnitResult;
  }

  /**
   * Get business unit by ID
   */
  async getById(orgId: string, buId: string): Promise<BusinessUnitResult | null> {
    const bu = await prisma.businessUnit.findUnique({
      where: { id: buId },
    });

    if (!bu || bu.orgId !== orgId) {
      return null;
    }

    return bu as BusinessUnitResult;
  }

  /**
   * List business units for a tenant
   */
  async list(
    orgId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<BusinessUnitResult[]> {
    const { limit = 50, offset = 0 } = options;

    const bus = await prisma.businessUnit.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return bus as BusinessUnitResult[];
  }

  /**
   * Update business unit
   */
  async update(
    orgId: string,
    userId: string,
    buId: string,
    input: UpdateBusinessUnitInput
  ): Promise<BusinessUnitResult> {
    const validated = UpdateBusinessUnitSchema.parse(input);

    // Verify BU exists
    const existing = await this.getById(orgId, buId);
    if (!existing) {
      throw new Error('Business unit not found');
    }

    // Check for duplicate name if changing name
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.businessUnit.findUnique({
        where: {
          orgId_name: {
            orgId,
            name: validated.name,
          },
        },
      });

      if (duplicate) {
        throw new Error('Business unit with this name already exists');
      }
    }

    // Update BU
    const bu = await prisma.businessUnit.update({
      where: { id: buId },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.timezone !== undefined && { timezone: validated.timezone }),
        ...(validated.address !== undefined && { address: validated.address }),
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: `business_unit:${bu.id}`,
      meta: { changes: validated },
    });

    return bu as BusinessUnitResult;
  }

  /**
   * Delete business unit
   */
  async delete(
    orgId: string,
    userId: string,
    buId: string
  ): Promise<void> {
    // Verify BU exists
    const existing = await this.getById(orgId, buId);
    if (!existing) {
      throw new Error('Business unit not found');
    }

    // Check if BU has associated resources
    const vehicleCount = await prisma.fleetVehicle.count({
      where: { buId },
    });

    const lobCount = await prisma.lineOfBusiness.count({
      where: { buId },
    });

    if (vehicleCount > 0 || lobCount > 0) {
      throw new Error(
        `Cannot delete business unit with ${vehicleCount} vehicles and ${lobCount} lines of business. Please reassign or delete them first.`
      );
    }

    // Delete BU
    await prisma.businessUnit.delete({
      where: { id: buId },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'delete',
      resource: `business_unit:${buId}`,
    });
  }
}

export const businessUnitService = new BusinessUnitService();


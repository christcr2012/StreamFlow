/**
 * Fleet Vehicle Service
 * Binder3: Fleet & Assets Management
 * 
 * Handles CRUD operations for fleet vehicles (trucks, trailers, equipment)
 */

import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit/auditLog';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const CreateVehicleSchema = z.object({
  buId: z.string().optional(),
  assetTag: z.string().optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  dotNumber: z.string().optional(),
  odometer: z.bigint().optional(),
  status: z.enum(['active', 'maintenance', 'retired']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateVehicleSchema = z.object({
  buId: z.string().optional(),
  assetTag: z.string().optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  dotNumber: z.string().optional(),
  odometer: z.bigint().optional(),
  status: z.enum(['active', 'maintenance', 'retired']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;

export interface VehicleResult {
  id: string;
  orgId: string;
  buId: string | null;
  assetTag: string | null;
  vin: string | null;
  plate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  dotNumber: string | null;
  odometer: bigint;
  status: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class FleetVehicleService {
  /**
   * Create a new fleet vehicle
   */
  async create(
    orgId: string,
    userId: string,
    input: CreateVehicleInput
  ): Promise<VehicleResult> {
    const validated = CreateVehicleSchema.parse(input);

    // Verify business unit exists if provided
    if (validated.buId) {
      const bu = await prisma.businessUnit.findUnique({
        where: { id: validated.buId },
      });

      if (!bu || bu.orgId !== orgId) {
        throw new Error('Business unit not found');
      }
    }

    // Create vehicle
    const vehicle = await prisma.fleetVehicle.create({
      data: {
        orgId,
        buId: validated.buId,
        assetTag: validated.assetTag,
        vin: validated.vin,
        plate: validated.plate,
        make: validated.make,
        model: validated.model,
        year: validated.year,
        dotNumber: validated.dotNumber,
        odometer: validated.odometer ?? BigInt(0),
        status: validated.status ?? 'active',
        metadata: (validated.metadata ?? {}) as any,
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'create',
      resource: `fleet_vehicle:${vehicle.id}`,
      meta: {
        assetTag: vehicle.assetTag,
        vin: vehicle.vin,
        plate: vehicle.plate,
      },
    });

    return vehicle as VehicleResult;
  }

  /**
   * Get vehicle by ID
   */
  async getById(orgId: string, vehicleId: string): Promise<VehicleResult | null> {
    const vehicle = await prisma.fleetVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.orgId !== orgId) {
      return null;
    }

    return vehicle as VehicleResult;
  }

  /**
   * List vehicles for a tenant
   */
  async list(
    orgId: string,
    options: {
      buId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<VehicleResult[]> {
    const { buId, status, limit = 50, offset = 0 } = options;

    const vehicles = await prisma.fleetVehicle.findMany({
      where: {
        orgId,
        ...(buId && { buId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return vehicles as VehicleResult[];
  }

  /**
   * Update vehicle
   */
  async update(
    orgId: string,
    userId: string,
    vehicleId: string,
    input: UpdateVehicleInput
  ): Promise<VehicleResult> {
    const validated = UpdateVehicleSchema.parse(input);

    // Verify vehicle exists
    const existing = await this.getById(orgId, vehicleId);
    if (!existing) {
      throw new Error('Vehicle not found');
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

    // Update vehicle
    const vehicle = await prisma.fleetVehicle.update({
      where: { id: vehicleId },
      data: {
        ...(validated.buId !== undefined && { buId: validated.buId }),
        ...(validated.assetTag !== undefined && { assetTag: validated.assetTag }),
        ...(validated.vin !== undefined && { vin: validated.vin }),
        ...(validated.plate !== undefined && { plate: validated.plate }),
        ...(validated.make !== undefined && { make: validated.make }),
        ...(validated.model !== undefined && { model: validated.model }),
        ...(validated.year !== undefined && { year: validated.year }),
        ...(validated.dotNumber !== undefined && { dotNumber: validated.dotNumber }),
        ...(validated.odometer !== undefined && { odometer: validated.odometer }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.metadata !== undefined && { metadata: validated.metadata as any }),
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: `fleet_vehicle:${vehicle.id}`,
      meta: { changes: validated },
    });

    return vehicle as VehicleResult;
  }

  /**
   * Delete vehicle (soft delete by setting status to 'retired')
   */
  async delete(
    orgId: string,
    userId: string,
    vehicleId: string,
    hard: boolean = false
  ): Promise<void> {
    // Verify vehicle exists
    const existing = await this.getById(orgId, vehicleId);
    if (!existing) {
      throw new Error('Vehicle not found');
    }

    if (hard) {
      // Hard delete
      await prisma.fleetVehicle.delete({
        where: { id: vehicleId },
      });
    } else {
      // Soft delete
      await prisma.fleetVehicle.update({
        where: { id: vehicleId },
        data: { status: 'retired' },
      });
    }

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'delete',
      resource: `fleet_vehicle:${vehicleId}`,
      meta: { hard },
    });
  }

  /**
   * Log odometer reading
   */
  async logOdometer(
    orgId: string,
    userId: string,
    vehicleId: string,
    odometer: bigint,
    loggedAt?: Date
  ): Promise<VehicleResult> {
    // Verify vehicle exists
    const existing = await this.getById(orgId, vehicleId);
    if (!existing) {
      throw new Error('Vehicle not found');
    }

    // Update odometer
    const vehicle = await prisma.fleetVehicle.update({
      where: { id: vehicleId },
      data: { odometer },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: `fleet_vehicle:${vehicleId}`,
      meta: {
        action: 'log_odometer',
        odometer: odometer.toString(),
        loggedAt: loggedAt?.toISOString() ?? new Date().toISOString(),
      },
    });

    return vehicle as VehicleResult;
  }
}

export const fleetVehicleService = new FleetVehicleService();


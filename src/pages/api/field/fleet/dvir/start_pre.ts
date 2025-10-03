import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const StartPreTripSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    vehicle_id: z.string(),
    odometer: z.number().int().positive(),
    fuel_level: z.number().min(0).max(100).optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }).optional(),
    notes: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    const validation = StartPreTripSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Verify vehicle exists (using Asset model for vehicles)
    const vehicle = await prisma.asset.findFirst({
      where: {
        id: payload.vehicle_id.replace('VEH-', ''),
        orgId,
        category: 'vehicle',
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        error: 'VEHICLE_NOT_FOUND',
        message: 'Vehicle not found',
      });
    }

    // Create DVIR record using Note model (since there's no specific DVIR model)
    const dvir = await prisma.note.create({
      data: {
        orgId,
        entityType: 'vehicle',
        entityId: vehicle.id,
        userId,
        body: `PRE-TRIP DVIR STARTED - Vehicle: ${vehicle.name}, Odometer: ${payload.odometer}, Fuel: ${payload.fuel_level || 'N/A'}%${payload.notes ? `, Notes: ${payload.notes}` : ''}`,
        isPinned: true, // Pin DVIR records for visibility
      },
    });

    // Update vehicle with current odometer and fuel level
    await prisma.asset.update({
      where: { id: vehicle.id },
      data: {
        customFields: {
          ...((vehicle.customFields as any) || {}),
          current_odometer: payload.odometer,
          fuel_level: payload.fuel_level,
          last_dvir_at: new Date().toISOString(),
          last_dvir_by: userId,
          dvir_status: 'in_progress',
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'fleet.dvir.start_pre',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'start_pre_trip',
        resource: `vehicle:${vehicle.id}`,
        meta: {
          vehicle_id: payload.vehicle_id,
          odometer: payload.odometer,
          fuel_level: payload.fuel_level,
          location: payload.location,
          notes: payload.notes,
        },
      },
    });

    const dvirId = `DVIR-${dvir.id.substring(0, 6)}`;
    const vehicleIdFormatted = `VEH-${vehicle.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: dvirId,
        version: 1,
      },
      dvir: {
        id: dvirId,
        vehicle_id: vehicleIdFormatted,
        vehicle_name: vehicle.name,
        dvir_type: 'pre_trip',
        status: 'in_progress',
        odometer: payload.odometer,
        fuel_level: payload.fuel_level,
        started_by: userId,
        started_at: dvir.createdAt,
        location: payload.location,
        notes: payload.notes,
      },
      audit_id: `AUD-DVIR-${dvir.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error starting pre-trip DVIR:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to start pre-trip DVIR',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

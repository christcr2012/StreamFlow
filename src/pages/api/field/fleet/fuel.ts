import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const LogFuelSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    vehicle_id: z.string(),
    fuel_amount_gallons: z.number().positive(),
    fuel_cost_cents: z.number().int().positive(),
    odometer: z.number().int().positive(),
    fuel_station: z.string().optional(),
    receipt_photo: z.string().optional(),
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

    const validation = LogFuelSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

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

    // Create fuel log entry
    const fuelLog = await prisma.note.create({
      data: {
        orgId,
        entityType: 'vehicle',
        entityId: vehicle.id,
        userId,
        body: `FUEL LOG: ${payload.fuel_amount_gallons} gallons, $${(payload.fuel_cost_cents / 100).toFixed(2)}, Odometer: ${payload.odometer}${payload.fuel_station ? `, Station: ${payload.fuel_station}` : ''}${payload.notes ? `, Notes: ${payload.notes}` : ''}`,
        isPinned: false,
      },
    });

    // Update vehicle with latest fuel and odometer data
    const currentCustomFields = (vehicle.customFields as any) || {};
    const previousOdometer = currentCustomFields.current_odometer || 0;
    const milesDriven = payload.odometer - previousOdometer;
    const mpg = milesDriven > 0 && payload.fuel_amount_gallons > 0 ? 
      (milesDriven / payload.fuel_amount_gallons).toFixed(2) : null;

    await prisma.asset.update({
      where: { id: vehicle.id },
      data: {
        customFields: {
          ...currentCustomFields,
          current_odometer: payload.odometer,
          fuel_level: 100, // Assume full tank after fueling
          last_fuel_at: new Date().toISOString(),
          last_fuel_by: userId,
          total_fuel_cost_cents: (currentCustomFields.total_fuel_cost_cents || 0) + payload.fuel_cost_cents,
          total_fuel_gallons: (currentCustomFields.total_fuel_gallons || 0) + payload.fuel_amount_gallons,
          last_mpg: mpg,
          miles_driven: (currentCustomFields.miles_driven || 0) + milesDriven,
        },
      },
    });

    // Store receipt photo if provided
    if (payload.receipt_photo) {
      const receiptId = `RECEIPT-${Date.now()}`;
      await prisma.asset.create({
        data: {
          orgId,
          name: `fuel_receipt_${vehicle.id}`,
          category: 'receipt',
          assetNumber: receiptId,
          qrCode: `QR-${receiptId}`,
          customFields: {
            vehicle_id: vehicle.id,
            fuel_log_id: fuelLog.id,
            fuel_amount_gallons: payload.fuel_amount_gallons,
            fuel_cost_cents: payload.fuel_cost_cents,
            odometer: payload.odometer,
            fuel_station: payload.fuel_station,
            receipt_data: payload.receipt_photo,
            logged_by: userId,
            logged_at: new Date().toISOString(),
          },
        },
      });
    }

    await auditService.logBinderEvent({
      action: 'fleet.fuel.log',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'log_fuel',
        resource: `vehicle:${vehicle.id}`,
        meta: {
          vehicle_id: payload.vehicle_id,
          fuel_amount_gallons: payload.fuel_amount_gallons,
          fuel_cost_cents: payload.fuel_cost_cents,
          odometer: payload.odometer,
          fuel_station: payload.fuel_station,
          has_receipt: !!payload.receipt_photo,
          mpg: mpg,
          location: payload.location,
        },
      },
    });

    const fuelLogId = `FUEL-${fuelLog.id.substring(0, 6)}`;
    const vehicleIdFormatted = `VEH-${vehicle.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: fuelLogId,
        version: 1,
      },
      fuel_log: {
        id: fuelLogId,
        vehicle_id: vehicleIdFormatted,
        vehicle_name: vehicle.name,
        fuel_amount_gallons: payload.fuel_amount_gallons,
        fuel_cost_cents: payload.fuel_cost_cents,
        fuel_cost_dollars: (payload.fuel_cost_cents / 100).toFixed(2),
        odometer: payload.odometer,
        fuel_station: payload.fuel_station,
        mpg: mpg,
        has_receipt: !!payload.receipt_photo,
        logged_by: userId,
        logged_at: fuelLog.createdAt,
        location: payload.location,
        notes: payload.notes,
      },
      audit_id: `AUD-FUEL-${fuelLog.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error logging fuel:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to log fuel',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

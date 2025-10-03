import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SubmitDVIRSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    vehicle_id: z.string(),
    dvir_type: z.enum(['pre_trip', 'post_trip']),
    inspection_items: z.array(z.object({
      item_name: z.string(),
      status: z.enum(['pass', 'fail', 'defect']),
      notes: z.string().optional(),
    })),
    overall_status: z.enum(['pass', 'fail']),
    defects_found: z.number().int().min(0).default(0),
    signature_data: z.string().optional(),
    photos: z.array(z.string()).optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }).optional(),
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

    const validation = SubmitDVIRSchema.safeParse(req.body);
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

    // Create completed DVIR record
    const dvir = await prisma.note.create({
      data: {
        orgId,
        entityType: 'vehicle',
        entityId: vehicle.id,
        userId,
        body: `${payload.dvir_type.toUpperCase()} DVIR COMPLETED - Status: ${payload.overall_status.toUpperCase()}, Defects: ${payload.defects_found}, Items: ${payload.inspection_items.length}`,
        isPinned: payload.overall_status === 'fail' || payload.defects_found > 0,
      },
    });

    // Update vehicle status
    await prisma.asset.update({
      where: { id: vehicle.id },
      data: {
        customFields: {
          ...((vehicle.customFields as any) || {}),
          dvir_status: payload.overall_status,
          last_dvir_completed_at: new Date().toISOString(),
          last_dvir_by: userId,
          defects_count: payload.defects_found,
          inspection_items: payload.inspection_items,
        },
      },
    });

    // If there are defects, create defect records
    if (payload.defects_found > 0) {
      const defectItems = payload.inspection_items.filter(item => item.status === 'defect');
      for (const defect of defectItems) {
        await prisma.note.create({
          data: {
            orgId,
            entityType: 'vehicle',
            entityId: vehicle.id,
            userId,
            body: `VEHICLE DEFECT: ${defect.item_name} - ${defect.notes || 'No additional notes'}`,
            isPinned: true,
          },
        });
      }
    }

    // Store signature if provided
    if (payload.signature_data) {
      const signatureId = `SIG-DVIR-${Date.now()}`;
      await prisma.asset.create({
        data: {
          orgId,
          name: `dvir_signature_${vehicle.id}`,
          category: 'signature',
          assetNumber: signatureId,
          qrCode: `QR-${signatureId}`,
          customFields: {
            vehicle_id: vehicle.id,
            dvir_id: dvir.id,
            dvir_type: payload.dvir_type,
            signature_data: payload.signature_data,
            signed_by: userId,
            signed_at: new Date().toISOString(),
          },
        },
      });
    }

    await auditService.logBinderEvent({
      action: 'fleet.dvir.submit',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'submit_dvir',
        resource: `vehicle:${vehicle.id}`,
        meta: {
          vehicle_id: payload.vehicle_id,
          dvir_type: payload.dvir_type,
          overall_status: payload.overall_status,
          defects_found: payload.defects_found,
          items_inspected: payload.inspection_items.length,
          has_signature: !!payload.signature_data,
          photos_count: payload.photos?.length || 0,
          location: payload.location,
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
        dvir_type: payload.dvir_type,
        overall_status: payload.overall_status,
        defects_found: payload.defects_found,
        inspection_items: payload.inspection_items,
        has_signature: !!payload.signature_data,
        photos_count: payload.photos?.length || 0,
        completed_by: userId,
        completed_at: dvir.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-DVIR-${dvir.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error submitting DVIR:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to submit DVIR',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

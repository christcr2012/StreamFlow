import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddDefectSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    vehicle_id: z.string(),
    defect_type: z.enum(['safety', 'mechanical', 'electrical', 'cosmetic', 'other']),
    component: z.string(),
    description: z.string().min(1),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    photos: z.array(z.string()).optional(),
    requires_immediate_attention: z.boolean().default(false),
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

    const validation = AddDefectSchema.safeParse(req.body);
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

    // Create defect record
    const defect = await prisma.note.create({
      data: {
        orgId,
        entityType: 'vehicle',
        entityId: vehicle.id,
        userId,
        body: `DEFECT [${payload.severity.toUpperCase()}] ${payload.defect_type}: ${payload.component} - ${payload.description}${payload.requires_immediate_attention ? ' [IMMEDIATE ATTENTION REQUIRED]' : ''}`,
        isPinned: payload.severity === 'critical' || payload.requires_immediate_attention,
      },
    });

    // Update vehicle defect count
    const currentCustomFields = (vehicle.customFields as any) || {};
    const currentDefectCount = currentCustomFields.defects_count || 0;
    
    await prisma.asset.update({
      where: { id: vehicle.id },
      data: {
        customFields: {
          ...currentCustomFields,
          defects_count: currentDefectCount + 1,
          last_defect_at: new Date().toISOString(),
          vehicle_status: payload.requires_immediate_attention ? 'out_of_service' : 'defects_noted',
        },
      },
    });

    // If critical or requires immediate attention, create maintenance ticket
    if (payload.severity === 'critical' || payload.requires_immediate_attention) {
      await prisma.note.create({
        data: {
          orgId,
          entityType: 'vehicle',
          entityId: vehicle.id,
          userId,
          body: `MAINTENANCE TICKET CREATED: Critical defect on ${payload.component} requires immediate attention. Defect ID: ${defect.id}`,
          isPinned: true,
        },
      });
    }

    await auditService.logBinderEvent({
      action: 'fleet.dvir.defect.add',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'add_defect',
        resource: `vehicle:${vehicle.id}`,
        meta: {
          vehicle_id: payload.vehicle_id,
          defect_type: payload.defect_type,
          component: payload.component,
          severity: payload.severity,
          requires_immediate_attention: payload.requires_immediate_attention,
          photos_count: payload.photos?.length || 0,
          location: payload.location,
        },
      },
    });

    const defectId = `DEF-${defect.id.substring(0, 6)}`;
    const vehicleIdFormatted = `VEH-${vehicle.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: defectId,
        version: 1,
      },
      defect: {
        id: defectId,
        vehicle_id: vehicleIdFormatted,
        vehicle_name: vehicle.name,
        defect_type: payload.defect_type,
        component: payload.component,
        description: payload.description,
        severity: payload.severity,
        status: 'open',
        requires_immediate_attention: payload.requires_immediate_attention,
        photos_count: payload.photos?.length || 0,
        reported_by: userId,
        reported_at: defect.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-DEF-${defect.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error adding defect:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to add defect',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

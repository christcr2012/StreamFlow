import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Maintenance Management
const CreateMaintenanceSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    asset_id: z.string(),
    maintenance_type: z.enum(['preventive', 'corrective', 'emergency', 'inspection']),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'normal', 'high', 'critical']),
    scheduled_date: z.string(),
    estimated_duration_hours: z.number().positive(),
    assigned_technician_id: z.string().optional(),
    parts_needed: z.array(z.object({
      part_id: z.string(),
      quantity: z.number().positive(),
    })).default([]),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateMaintenanceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only managers and owners can create maintenance tickets',
      });
    }

    const asset = await prisma.asset.findFirst({
      where: { id: payload.asset_id, orgId },
    });

    if (!asset) {
      return res.status(404).json({
        error: 'ASSET_NOT_FOUND',
        message: 'Asset not found',
      });
    }

    // Validate technician if assigned
    if (payload.assigned_technician_id) {
      const technician = await prisma.user.findFirst({
        where: { id: payload.assigned_technician_id, orgId, role: 'EMPLOYEE' },
      });

      if (!technician) {
        return res.status(404).json({
          error: 'TECHNICIAN_NOT_FOUND',
          message: 'Assigned technician not found',
        });
      }
    }

    const maintenanceTicket = await prisma.note.create({
      data: {
        orgId,
        entityType: 'maintenance_ticket',
        entityId: `MAINT-${Date.now()}`,
        userId: actor.user_id,
        body: `MAINTENANCE: ${payload.title} - ${payload.description} (${payload.maintenance_type}, ${payload.priority} priority)`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.maintenance.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_maintenance_ticket',
        resource: `maintenance:${maintenanceTicket.entityId}`,
        meta: { 
          asset_id: payload.asset_id,
          maintenance_type: payload.maintenance_type,
          title: payload.title,
          priority: payload.priority,
          scheduled_date: payload.scheduled_date,
          assigned_technician_id: payload.assigned_technician_id,
          parts_needed: payload.parts_needed 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: maintenanceTicket.entityId,
        version: 1,
      },
      maintenance_ticket: {
        id: maintenanceTicket.entityId,
        asset_id: payload.asset_id,
        asset_name: asset.name,
        maintenance_type: payload.maintenance_type,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        scheduled_date: payload.scheduled_date,
        estimated_duration_hours: payload.estimated_duration_hours,
        assigned_technician_id: payload.assigned_technician_id,
        parts_needed: payload.parts_needed,
        status: 'scheduled',
        created_at: maintenanceTicket.createdAt.toISOString(),
      },
      audit_id: `AUD-${maintenanceTicket.entityId}`,
    });
  } catch (error) {
    console.error('Error creating maintenance ticket:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create maintenance ticket',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Territory Management
const CreateTerritorySchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    name: z.string(),
    description: z.string().optional(),
    territory_type: z.enum(['geographic', 'customer_based', 'service_type', 'hybrid']),
    boundaries: z.object({
      zip_codes: z.array(z.string()).optional(),
      cities: z.array(z.string()).optional(),
      states: z.array(z.string()).optional(),
      radius_miles: z.number().positive().optional(),
      center_lat: z.number().optional(),
      center_lng: z.number().optional(),
    }).optional(),
    assigned_manager: z.string(),
    assigned_technicians: z.array(z.string()).default([]),
    service_types: z.array(z.string()).default([]),
    priority_level: z.enum(['low', 'normal', 'high']).default('normal'),
    active: z.boolean().default(true),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateTerritorySchema.safeParse(req.body);
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
        message: 'Only managers and owners can create territories',
      });
    }

    // Validate assigned manager exists
    const manager = await prisma.user.findFirst({
      where: { id: payload.assigned_manager, orgId, role: { in: ['MANAGER', 'OWNER'] } },
    });

    if (!manager) {
      return res.status(404).json({
        error: 'MANAGER_NOT_FOUND',
        message: 'Assigned manager not found',
      });
    }

    // Validate assigned technicians exist
    if (payload.assigned_technicians.length > 0) {
      const technicians = await prisma.user.findMany({
        where: { id: { in: payload.assigned_technicians }, orgId, role: 'EMPLOYEE' },
      });

      if (technicians.length !== payload.assigned_technicians.length) {
        return res.status(404).json({
          error: 'TECHNICIANS_NOT_FOUND',
          message: 'One or more assigned technicians not found',
        });
      }
    }

    const territoryCode = `TER-${Date.now()}`;

    const territory = await prisma.note.create({
      data: {
        orgId,
        entityType: 'territory',
        entityId: territoryCode,
        userId: actor.user_id,
        body: `TERRITORY: ${payload.name} - ${payload.description} (${payload.territory_type})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.territory.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_territory',
        resource: `territory:${territory.id}`,
        meta: { 
          name: payload.name,
          territory_type: payload.territory_type,
          assigned_manager: payload.assigned_manager,
          assigned_technicians: payload.assigned_technicians,
          boundaries: payload.boundaries 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `TER-${territory.id.substring(0, 6)}`,
        version: 1,
      },
      territory: {
        id: territory.id,
        territory_code: territoryCode,
        name: payload.name,
        description: payload.description,
        territory_type: payload.territory_type,
        boundaries: payload.boundaries,
        assigned_manager: payload.assigned_manager,
        assigned_manager_name: manager.name,
        assigned_technicians: payload.assigned_technicians,
        service_types: payload.service_types,
        priority_level: payload.priority_level,
        active: payload.active,
        created_at: territory.createdAt.toISOString(),
      },
      audit_id: `AUD-TER-${territory.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating territory:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create territory',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

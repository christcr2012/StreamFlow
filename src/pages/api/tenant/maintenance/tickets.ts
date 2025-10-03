import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button: DVIR — Create Maintenance Ticket (02_fleet_dvir)
const TicketsSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    // Add specific payload fields based on button specification
    id: z.string().optional(),
    name: z.string().optional(),
    data: z.any().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = TicketsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    // RBAC check based on audience
    const allowedRoles = ['EMPLOYEE', 'MANAGER', 'OWNER'];
    
    if (!allowedRoles.includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation',
      });
    }

    // Create or update resource
    const resourceId = `${'TIC'}-${Date.now()}`;
    
    const resource = await prisma.note.create({
      data: {
        orgId,
        entityType: 'tickets',
        entityId: resourceId,
        userId: actor.user_id,
        body: `DVIR — CREATE MAINTENANCE TICKET: ${JSON.stringify(payload)}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.dvir___create_maintenance_ticket',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'dvir___create_maintenance_ticket',
        resource: `${'tickets'}:${resource.id}`,
        meta: payload,
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `${'TIC'}-${resource.id.substring(0, 6)}`,
        version: 1,
      },
      tickets: {
        id: resource.id,
        resource_id: resourceId,
        ...payload,
        status: 'created',
        created_at: resource.createdAt.toISOString(),
      },
      audit_id: `AUD-${'TIC'}-${resource.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error in DVIR — Create Maintenance Ticket:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process DVIR — Create Maintenance Ticket',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
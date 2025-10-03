import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const RequestAssistSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    assist_type: z.enum(['technical', 'parts', 'customer', 'safety', 'other']),
    urgency: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    description: z.string().min(1),
    preferred_contact: z.enum(['call', 'text', 'app']).default('app'),
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

    const validation = RequestAssistSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;
    const workOrderId = payload.work_order_id.replace('WO-', '');

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, orgId },
      include: { assignments: true },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

    const isAssigned = workOrder.assignments.some(
      assignment => assignment.employeeId === userId && !assignment.unassignedAt
    );

    if (!isAssigned) {
      return res.status(403).json({
        error: 'NOT_ASSIGNED',
        message: 'User is not assigned to this work order',
      });
    }

    // Create assistance request using Note model
    const assistRequest = await prisma.note.create({
      data: {
        orgId,
        entityType: 'workorder',
        entityId: workOrderId,
        userId,
        body: `ASSISTANCE REQUEST [${payload.urgency.toUpperCase()}] ${payload.assist_type}: ${payload.description}. Preferred contact: ${payload.preferred_contact}`,
        isPinned: payload.urgency === 'urgent' || payload.urgency === 'high',
      },
    });

    await auditService.logBinderEvent({
      action: 'workorder.assist.request',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'request_assist',
        resource: `workorder:${workOrderId}`,
        meta: {
          assist_type: payload.assist_type,
          urgency: payload.urgency,
          preferred_contact: payload.preferred_contact,
          location: payload.location,
        },
      },
    });

    const assistId = `ASSIST-${assistRequest.id.substring(0, 6)}`;
    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: assistId,
        version: 1,
      },
      assist_request: {
        id: assistId,
        work_order_id: workOrderIdFormatted,
        assist_type: payload.assist_type,
        urgency: payload.urgency,
        description: payload.description,
        preferred_contact: payload.preferred_contact,
        status: 'PENDING',
        requested_by: userId,
        requested_at: assistRequest.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-ASSIST-${assistRequest.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error requesting assistance:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to request assistance',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

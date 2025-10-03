import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const StartWorkOrderSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
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

    // Validate request body
    const validation = StartWorkOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract work order ID
    const workOrderId = payload.work_order_id.replace('WO-', '');
    if (!workOrderId) {
      return res.status(400).json({
        error: 'INVALID_WORK_ORDER_ID',
        message: 'Work order ID must be in format WO-000001',
      });
    }

    // Find work order
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        orgId,
        status: 'SCHEDULED', // Only allow starting scheduled work orders
      },
      include: {
        assignments: true, // Include assignments to check if user is assigned
      },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found or not in scheduled status',
      });
    }

    // Check if user is assigned to this work order
    const isAssigned = workOrder.assignments.some(assignment =>
      assignment.employeeId === userId && !assignment.unassignedAt
    );

    if (!isAssigned) {
      return res.status(403).json({
        error: 'NOT_ASSIGNED',
        message: 'You are not assigned to this work order',
      });
    }

    // Start work order
    const startedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'IN_PROGRESS',
        actualStartAt: new Date(),
        description: payload.notes ?
          `${workOrder.description || ''}\n\nStart Notes: ${payload.notes}`.trim() :
          workOrder.description,
      },
    });

    // Create audit log entry (using AuditLog2 model)
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'start',
        resource: `workorder:${workOrderId}`,
        meta: {
          location: payload.location,
          notes: payload.notes,
        },
      },
    });

    const workOrderIdFormatted = `WO-${startedWorkOrder.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'field.workorder.start',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: workOrderIdFormatted,
        version: 1,
      },
      work_order: {
        id: workOrderIdFormatted,
        status: startedWorkOrder.status,
        started_at: startedWorkOrder.actualStartAt,
        location: payload.location,
        notes: payload.notes,
      },
      audit_id: `AUD-WO-${startedWorkOrder.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error starting work order:', error);
    await auditService.logBinderEvent({
      action: 'field.workorder.start.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to start work order',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

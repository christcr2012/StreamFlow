import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const PauseWorkOrderSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    pause_reason: z.string().min(1),
    notes: z.string().optional(),
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

    // Validate BINDER5_FULL contract
    const validation = PauseWorkOrderSchema.safeParse(req.body);
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

    // Find work order and verify it's in progress
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        orgId,
      },
      include: {
        assignments: true,
      },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: 'Work order must be in progress to pause',
      });
    }

    // Verify user is assigned to this work order
    const isAssigned = workOrder.assignments.some(
      assignment => assignment.employeeId === userId && !assignment.unassignedAt
    );

    if (!isAssigned) {
      return res.status(403).json({
        error: 'NOT_ASSIGNED',
        message: 'User is not assigned to this work order',
      });
    }

    // Pause work order
    const pausedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        pauseReason: payload.pause_reason,
        description: payload.notes ? 
          `${workOrder.description || ''}\n\nPause Notes: ${payload.notes}`.trim() : 
          workOrder.description,
      },
    });

    // Create audit log entry
    await auditService.logBinderEvent({
      action: 'workorder.pause',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'pause',
        resource: `workorder:${workOrderId}`,
        meta: {
          pause_reason: payload.pause_reason,
          notes: payload.notes,
          location: payload.location,
        },
      },
    });

    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(200).json({
      status: 'ok',
      result: {
        id: workOrderIdFormatted,
        version: pausedWorkOrder.version || 1,
      },
      work_order: {
        id: workOrderIdFormatted,
        status: pausedWorkOrder.status,
        paused_at: pausedWorkOrder.pausedAt,
        pause_reason: payload.pause_reason,
        notes: payload.notes,
      },
      audit_id: `AUD-WO-${workOrderId.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error pausing work order:', error);
    await auditService.logBinderEvent({
      action: 'workorder.pause.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to pause work order',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

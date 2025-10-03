import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CompleteWorkOrderSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    completion_notes: z.string().optional(),
    customer_signature: z.string().optional(), // Base64 encoded signature
    photos: z.array(z.string()).optional(), // Array of photo URLs/IDs
    parts_used: z.array(z.object({
      item_id: z.string(),
      quantity: z.number(),
    })).optional(),
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
    const validation = CompleteWorkOrderSchema.safeParse(req.body);
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
        message: 'Work order must be in progress to complete',
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

    // Complete work order (without metadata field)
    const completedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'COMPLETED',
        actualEndAt: new Date(),
        completedBy: userId,
        description: payload.completion_notes ?
          `${workOrder.description || ''}\n\nCompletion Notes: ${payload.completion_notes}`.trim() :
          workOrder.description,
      },
    });

    // Create audit log entry
    await auditService.logBinderEvent({
      action: 'workorder.complete',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    // Create audit log entry using AuditLog2 model
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'complete',
        resource: `workorder:${workOrderId}`,
        meta: {
          completion_notes: payload.completion_notes,
          photos_count: payload.photos?.length || 0,
          parts_used_count: payload.parts_used?.length || 0,
          location: payload.location,
        },
      },
    });

    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(200).json({
      status: 'ok',
      result: {
        id: workOrderIdFormatted,
        version: completedWorkOrder.version || 1,
      },
      work_order: {
        id: workOrderIdFormatted,
        status: completedWorkOrder.status,
        completed_at: completedWorkOrder.actualEndAt,
        completed_by: userId,
        completion_notes: payload.completion_notes,
        photos: payload.photos,
        parts_used: payload.parts_used,
      },
      audit_id: `AUD-WO-${workOrderId.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error completing work order:', error);
    await auditService.logBinderEvent({
      action: 'workorder.complete.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to complete work order',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

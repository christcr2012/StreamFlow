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
    started_at: z.string(),
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

    const { request_id, payload, idempotency_key, actor } = validation.data;

    // RBAC: tenant_employee|tenant_manager|tenant_owner (BINDER5_FULL line 84)
    if (!['EMPLOYEE', 'MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions to start work order',
      });
    }

    // Find work order with domain-specific validation
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: payload.work_order_id,
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

    // Domain-specific rules validation (BINDER5_FULL line 115)
    if (workOrder.status === 'IN_PROGRESS') {
      return res.status(422).json({
        error: 'WORK_ORDER_ALREADY_STARTED',
        message: 'Work order is already in progress',
      });
    }

    if (workOrder.status === 'COMPLETED') {
      return res.status(422).json({
        error: 'WORK_ORDER_COMPLETED',
        message: 'Cannot start a completed work order',
      });
    }

    // Check if user is assigned to this work order (for employees only)
    if (actor.role === 'EMPLOYEE') {
      const isAssigned = workOrder.assignments.some(assignment =>
        assignment.employeeId === actor.user_id
      );

      if (!isAssigned) {
        return res.status(403).json({
          error: 'NOT_ASSIGNED',
          message: 'Employee not assigned to this work order',
        });
      }
    }

    // Update work order to started status - exact as per BINDER5_FULL
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: payload.work_order_id },
      data: {
        status: 'IN_PROGRESS',
        actualStartAt: new Date(payload.started_at),
        version: { increment: 1 },
      },
    });

    // Audit logging as per specification
    await auditService.logBinderEvent({
      action: 'field.workorder.start',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    const auditId = `AUD-WOR-${updatedWorkOrder.id.substring(0, 6)}`;
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'start_work_order',
        resource: `work_order:${payload.work_order_id}`,
        meta: {
          work_order_id: payload.work_order_id,
          started_at: payload.started_at,
          request_id,
          idempotency_key,
        },
      },
    });

    // Response format exactly as specified in BINDER5_FULL lines 105-113
    return res.status(200).json({
      status: 'ok',
      result: {
        id: `WOR-${updatedWorkOrder.id.substring(0, 6)}`,
        version: updatedWorkOrder.version,
      },
      audit_id: auditId,
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

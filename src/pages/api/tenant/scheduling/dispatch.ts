import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Scheduling & Dispatch
const DispatchSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    technician_id: z.string(),
    scheduled_date: z.string(),
    time_window: z.object({
      start: z.string(),
      end: z.string(),
    }),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    estimated_duration_minutes: z.number().positive(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = DispatchSchema.safeParse(req.body);
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
        message: 'Only managers and owners can dispatch work orders',
      });
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: payload.work_order_id, orgId },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

    const technician = await prisma.user.findFirst({
      where: { id: payload.technician_id, orgId, role: 'EMPLOYEE' },
    });

    if (!technician) {
      return res.status(404).json({
        error: 'TECHNICIAN_NOT_FOUND',
        message: 'Technician not found',
      });
    }

    // Update work order with dispatch information
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: payload.work_order_id },
      data: {
        status: 'SCHEDULED',
        scheduledStartAt: new Date(`${payload.scheduled_date}T${payload.time_window.start}`),
        scheduledEndAt: new Date(`${payload.scheduled_date}T${payload.time_window.end}`),
        version: { increment: 1 },
      },
    });

    // Create job assignment
    const assignment = await prisma.jobAssignment.create({
      data: {
        orgId,
        employeeId: payload.technician_id,
        jobId: payload.work_order_id,
        role: 'primary',
        assignedAt: new Date(),
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.scheduling.dispatch',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'dispatch_work_order',
        resource: `work_order:${payload.work_order_id}`,
        meta: { 
          work_order_id: payload.work_order_id,
          technician_id: payload.technician_id,
          scheduled_date: payload.scheduled_date,
          time_window: payload.time_window,
          priority: payload.priority,
          estimated_duration_minutes: payload.estimated_duration_minutes 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `DIS-${assignment.id.substring(0, 6)}`,
        version: updatedWorkOrder.version,
      },
      dispatch: {
        work_order_id: payload.work_order_id,
        technician_id: payload.technician_id,
        technician_name: technician.name,
        scheduled_date: payload.scheduled_date,
        time_window: payload.time_window,
        priority: payload.priority,
        estimated_duration_minutes: payload.estimated_duration_minutes,
        status: 'scheduled',
        dispatched_at: new Date().toISOString(),
      },
      audit_id: `AUD-DIS-${assignment.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error dispatching work order:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to dispatch work order',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

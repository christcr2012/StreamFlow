import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 10: WorkOrder — Time Entry (line 440)
const TimeEntrySchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    break_minutes: z.number().default(0),
    activity_type: z.string(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = TimeEntrySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['EMPLOYEE', 'MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
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

    const startTime = new Date(payload.start_time);
    const endTime = new Date(payload.end_time);
    const totalMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const billableMinutes = Math.max(0, totalMinutes - payload.break_minutes);

    const timeEntry = await prisma.note.create({
      data: {
        orgId,
        entityType: 'time_entry',
        entityId: `${payload.work_order_id}-${Date.now()}`,
        userId: actor.user_id,
        body: `TIME ENTRY: ${payload.activity_type} - ${billableMinutes} billable minutes (${totalMinutes} total, ${payload.break_minutes} break)`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'field.workorder.time_entry',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'time_entry',
        resource: `work_order:${payload.work_order_id}`,
        meta: { 
          work_order_id: payload.work_order_id, 
          start_time: payload.start_time,
          end_time: payload.end_time,
          break_minutes: payload.break_minutes,
          activity_type: payload.activity_type,
          billable_minutes: billableMinutes 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `TME-${timeEntry.id.substring(0, 6)}`,
        version: 1,
      },
      time_entry: {
        total_minutes: totalMinutes,
        break_minutes: payload.break_minutes,
        billable_minutes: billableMinutes,
        activity_type: payload.activity_type,
        start_time: payload.start_time,
        end_time: payload.end_time,
      },
      audit_id: `AUD-TME-${timeEntry.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating time entry:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create time entry',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

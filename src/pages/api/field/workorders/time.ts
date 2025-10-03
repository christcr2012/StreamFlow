import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
    entry_type: z.enum(['start', 'stop', 'break_start', 'break_end']),
    timestamp: z.string().datetime().optional(),
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

    const validation = TimeEntrySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;
    const workOrderId = payload.work_order_id.replace('WO-', '');
    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

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

    let timeEntry;
    let durationMinutes = null;

    if (payload.entry_type === 'start' || payload.entry_type === 'break_start') {
      // Create new time entry
      timeEntry = await prisma.workOrderTimeEntry.create({
        data: {
          orgId,
          workOrderId,
          userId,
          startedAt: timestamp,
          notes: payload.notes,
        },
      });
    } else {
      // Find the most recent open time entry and close it
      const openEntry = await prisma.workOrderTimeEntry.findFirst({
        where: {
          orgId,
          workOrderId,
          userId,
          endedAt: null,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      if (!openEntry) {
        return res.status(400).json({
          error: 'NO_OPEN_ENTRY',
          message: 'No open time entry found to close',
        });
      }

      durationMinutes = Math.round((timestamp.getTime() - openEntry.startedAt.getTime()) / (1000 * 60));

      timeEntry = await prisma.workOrderTimeEntry.update({
        where: { id: openEntry.id },
        data: {
          endedAt: timestamp,
          durationMinutes,
          notes: payload.notes || openEntry.notes,
        },
      });
    }

    await auditService.logBinderEvent({
      action: 'workorder.time.entry',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'time_entry',
        resource: `workorder:${workOrderId}`,
        meta: {
          entry_type: payload.entry_type,
          timestamp: timestamp.toISOString(),
          duration_minutes: durationMinutes,
          notes: payload.notes,
          location: payload.location,
        },
      },
    });

    const entryId = `TIME-${timeEntry.id.substring(0, 6)}`;
    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: entryId,
        version: 1,
      },
      time_entry: {
        id: entryId,
        work_order_id: workOrderIdFormatted,
        entry_type: payload.entry_type,
        started_at: timeEntry.startedAt,
        ended_at: timeEntry.endedAt,
        duration_minutes: durationMinutes,
        notes: payload.notes,
        user_id: userId,
        location: payload.location,
      },
      audit_id: `AUD-TIME-${timeEntry.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating time entry:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create time entry',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

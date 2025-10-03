import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddNoteSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    note_text: z.string().min(1),
    note_type: z.enum(['general', 'issue', 'customer', 'internal']).default('general'),
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

    const validation = AddNoteSchema.safeParse(req.body);
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

    // Create note using Note model
    const note = await prisma.note.create({
      data: {
        orgId,
        entityType: 'workorder',
        entityId: workOrderId,
        userId,
        body: payload.note_text,
        isPinned: payload.note_type === 'issue',
      },
    });

    await auditService.logBinderEvent({
      action: 'workorder.note.add',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'add_note',
        resource: `workorder:${workOrderId}`,
        meta: {
          note_type: payload.note_type,
          note_length: payload.note_text.length,
          location: payload.location,
        },
      },
    });

    const noteId = `NOTE-${note.id.substring(0, 6)}`;
    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: noteId,
        version: 1,
      },
      note: {
        id: noteId,
        work_order_id: workOrderIdFormatted,
        note_text: payload.note_text,
        note_type: payload.note_type,
        created_by: userId,
        created_at: note.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-NOTE-${note.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error adding note:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to add note',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CompleteWorkOrderSchema = z.object({
  work_order_id: z.string().min(1),
  completed_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${method} not allowed` });
    return;
  }

  try {
    const validated = CompleteWorkOrderSchema.parse(req.body);
    const completedAt = validated.completed_at ? new Date(validated.completed_at) : new Date();

    // Verify work order exists and belongs to org
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: validated.work_order_id,
        orgId,
      },
    });

    if (!workOrder) {
      res.status(404).json({ error: 'Work order not found' });
      return;
    }

    // Check if work order is already completed
    if (workOrder.status === 'COMPLETED') {
      res.status(400).json({ error: 'Work order already completed' });
      return;
    }

    // Update work order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: {
        id: validated.work_order_id,
      },
      data: {
        actualEndAt: completedAt,
        completedBy: userId,
        status: 'COMPLETED',
      },
    });

    // End current time entry if exists
    const activeTimeEntry = await prisma.workOrderTimeEntry.findFirst({
      where: {
        workOrderId: validated.work_order_id,
        userId,
        endedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (activeTimeEntry) {
      const durationMinutes = Math.floor(
        (completedAt.getTime() - activeTimeEntry.startedAt.getTime()) / 60000
      );

      await prisma.workOrderTimeEntry.update({
        where: {
          id: activeTimeEntry.id,
        },
        data: {
          endedAt: completedAt,
          durationMinutes,
        },
      });
    }

    // Add completion note if provided
    if (validated.notes) {
      await prisma.note.create({
        data: {
          orgId,
          userId,
          entityType: 'workorder',
          entityId: validated.work_order_id,
          body: validated.notes,
        },
      });
    }

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'complete',
        resource: `workorder:${validated.work_order_id}`,
        meta: {
          completedAt: completedAt.toISOString(),
          hasNotes: !!validated.notes,
        },
      },
    });

    res.status(200).json({
      status: 'ok',
      result: {
        id: updatedWorkOrder.id,
        version: updatedWorkOrder.version,
      },
      audit_id: `AUD-WOR-${updatedWorkOrder.id}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Work order complete error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


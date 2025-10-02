import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const PauseWorkOrderSchema = z.object({
  work_order_id: z.string().min(1),
  paused_at: z.string().datetime().optional(),
  reason: z.string().optional(),
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
    const validated = PauseWorkOrderSchema.parse(req.body);
    const pausedAt = validated.paused_at ? new Date(validated.paused_at) : new Date();

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

    // Check if work order is in progress
    if (workOrder.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Work order is not in progress' });
      return;
    }

    // Update work order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: {
        id: validated.work_order_id,
      },
      data: {
        pausedAt,
        pauseReason: validated.reason,
        status: 'PAUSED',
      },
    });

    // End current time entry
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
        (pausedAt.getTime() - activeTimeEntry.startedAt.getTime()) / 60000
      );

      await prisma.workOrderTimeEntry.update({
        where: {
          id: activeTimeEntry.id,
        },
        data: {
          endedAt: pausedAt,
          durationMinutes,
        },
      });
    }

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'pause',
        resource: `workorder:${validated.work_order_id}`,
        meta: {
          pausedAt: pausedAt.toISOString(),
          reason: validated.reason,
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

    console.error('Work order pause error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


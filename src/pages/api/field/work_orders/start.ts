import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const StartWorkOrderSchema = z.object({
  work_order_id: z.string().min(1),
  started_at: z.string().datetime().optional(),
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
    const validated = StartWorkOrderSchema.parse(req.body);
    const startedAt = validated.started_at ? new Date(validated.started_at) : new Date();

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

    // Check if already started
    if (workOrder.actualStartAt) {
      res.status(400).json({ error: 'Work order already started' });
      return;
    }

    // Update work order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: {
        id: validated.work_order_id,
      },
      data: {
        actualStartAt: startedAt,
        status: 'IN_PROGRESS',
      },
    });

    // Create time entry
    await prisma.workOrderTimeEntry.create({
      data: {
        orgId,
        workOrderId: validated.work_order_id,
        userId,
        startedAt,
      },
    });

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'start',
        resource: `workorder:${validated.work_order_id}`,
        meta: {
          startedAt: startedAt.toISOString(),
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

    console.error('Work order start error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


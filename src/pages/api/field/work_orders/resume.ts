import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ResumeWorkOrderSchema = z.object({
  work_order_id: z.string().min(1),
  resumed_at: z.string().datetime().optional(),
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
    const validated = ResumeWorkOrderSchema.parse(req.body);
    const resumedAt = validated.resumed_at ? new Date(validated.resumed_at) : new Date();

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

    // Check if work order is paused
    if (workOrder.status !== 'PAUSED') {
      res.status(400).json({ error: 'Work order is not paused' });
      return;
    }

    // Update work order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: {
        id: validated.work_order_id,
      },
      data: {
        resumedAt,
        status: 'IN_PROGRESS',
      },
    });

    // Create new time entry
    await prisma.workOrderTimeEntry.create({
      data: {
        orgId,
        workOrderId: validated.work_order_id,
        userId,
        startedAt: resumedAt,
      },
    });

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'resume',
        resource: `workorder:${validated.work_order_id}`,
        meta: {
          resumedAt: resumedAt.toISOString(),
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

    console.error('Work order resume error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


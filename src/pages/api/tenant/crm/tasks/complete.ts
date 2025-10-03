import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CompleteTaskSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    task_id: z.string(),
    completion_notes: z.string().optional(),
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
    const validation = CompleteTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract ID from task_id
    const taskId = payload.task_id.replace('TASK-', '');
    if (!taskId) {
      return res.status(400).json({
        error: 'INVALID_TASK_ID',
        message: 'Task ID must be in format TASK-000001',
      });
    }

    // Check if task exists and is not already completed
    const existingTask = await prisma.crmTask.findFirst({
      where: {
        id: taskId,
        orgId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: 'TASK_NOT_FOUND',
        message: 'Task not found',
      });
    }

    if (existingTask.status === 'done') {
      return res.status(422).json({
        error: 'TASK_ALREADY_COMPLETED',
        message: 'Task is already completed',
      });
    }

    // Complete task
    const completedTask = await prisma.crmTask.update({
      where: { id: taskId },
      data: {
        status: 'done',
      },
    });

    // Add completion note if provided
    if (payload.completion_notes) {
      await prisma.note.create({
        data: {
          orgId,
          entityType: 'task',
          entityId: taskId,
          userId: userId,
          body: `Task completed: ${payload.completion_notes}`,
        },
      });
    }

    const taskIdFormatted = `TASK-${completedTask.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.task.complete',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: taskIdFormatted,
        version: 1,
      },
      task: {
        id: taskIdFormatted,
        title: completedTask.title,
        status: completedTask.status,
        completed_at: completedTask.updatedAt,
        completed_by: userId,
      },
      audit_id: `AUD-TASK-${completedTask.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error completing task:', error);
    await auditService.logBinderEvent({
      action: 'crm.task.complete.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to complete task',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

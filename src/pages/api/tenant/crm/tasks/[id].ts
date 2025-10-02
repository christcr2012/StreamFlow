import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Zod schemas for validation
const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  assigneeUserId: z.string().nullable().optional(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
});

function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string, id: string) {
  try {
    const task = await prisma.crmTask.findFirst({
      where: { orgId, id },
    });

    if (!task) {
      return errorResponse(res, 404, 'NotFound', 'Task not found');
    }

    return res.status(200).json({
      ok: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch task');
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string) {
  try {
    const validation = UpdateTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    const updates = validation.data;

    // Check if task exists
    const existing = await prisma.crmTask.findFirst({
      where: { orgId, id },
    });

    if (!existing) {
      return errorResponse(res, 404, 'NotFound', 'Task not found');
    }

    // Build update data
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.dueAt !== undefined) updateData.dueAt = updates.dueAt ? new Date(updates.dueAt) : null;
    if (updates.assigneeUserId !== undefined) updateData.assigneeUserId = updates.assigneeUserId;
    if (updates.status !== undefined) updateData.status = updates.status;

    // Update task
    const task = await prisma.crmTask.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'update',
      entityType: 'crm_task',
      entityId: task.id,
      delta: updates,
    });

    return res.status(200).json({
      ok: true,
      data: task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to update task');
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string) {
  try {
    // Check if task exists
    const existing = await prisma.crmTask.findFirst({
      where: { orgId, id },
    });

    if (!existing) {
      return errorResponse(res, 404, 'NotFound', 'Task not found');
    }

    // Delete task
    await prisma.crmTask.delete({
      where: { id },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'delete',
      entityType: 'crm_task',
      entityId: id,
      delta: {},
    });

    return res.status(200).json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to delete task');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';
  const { id } = req.query;

  if (typeof id !== 'string') {
    return errorResponse(res, 400, 'BadRequest', 'Invalid task ID');
  }

  if (req.method === 'GET') {
    return handleGet(req, res, orgId, id);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, orgId, userId, id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, orgId, userId, id);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


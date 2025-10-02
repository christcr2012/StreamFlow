import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Zod schemas for validation
const CreateTaskSchema = z.object({
  idempotencyKey: z.string().uuid(),
  entityType: z.enum(['opportunity', 'organization', 'contact']),
  entityId: z.string(),
  title: z.string().min(1).max(500),
  dueAt: z.string().datetime().optional(),
  assigneeUserId: z.string().optional(),
});

const ListTasksSchema = z.object({
  entityType: z.enum(['opportunity', 'organization', 'contact']).optional(),
  entityId: z.string().optional(),
  assigneeUserId: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  try {
    const validation = ListTasksSchema.safeParse(req.query);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid query parameters', validation.error.errors);
    }

    const { entityType, entityId, assigneeUserId, status, limit, offset } = validation.data;

    const where: any = { orgId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (assigneeUserId) where.assigneeUserId = assigneeUserId;
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.crmTask.findMany({
        where,
        orderBy: { dueAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.crmTask.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: {
        tasks,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Error listing tasks:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to list tasks');
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string) {
  try {
    const validation = CreateTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    const { idempotencyKey, entityType, entityId, title, dueAt, assigneeUserId } = validation.data;

    // Check idempotency
    const existing = await prisma.crmTask.findFirst({
      where: {
        orgId,
        entityType,
        entityId,
        title,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (existing) {
      return res.status(200).json({
        ok: true,
        data: existing,
      });
    }

    // Verify entity exists
    let entityExists = false;
    if (entityType === 'opportunity') {
      entityExists = !!(await prisma.opportunity.findFirst({ where: { orgId, id: entityId } }));
    } else if (entityType === 'organization') {
      entityExists = !!(await prisma.customer.findFirst({ where: { orgId, id: entityId } }));
    } else if (entityType === 'contact') {
      entityExists = !!(await prisma.contact.findFirst({ where: { orgId, id: entityId } }));
    }

    if (!entityExists) {
      return errorResponse(res, 404, 'NotFound', `${entityType} not found`);
    }

    // Create task
    const task = await prisma.crmTask.create({
      data: {
        orgId,
        entityType,
        entityId,
        title,
        dueAt: dueAt ? new Date(dueAt) : null,
        assigneeUserId: assigneeUserId || null,
        status: 'open',
      },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'create',
      entityType: 'crm_task',
      entityId: task.id,
      delta: { title, entityType, entityId },
    });

    return res.status(201).json({
      ok: true,
      data: task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to create task');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';

  if (req.method === 'GET') {
    return handleGet(req, res, orgId);
  } else if (req.method === 'POST') {
    return handlePost(req, res, orgId, userId);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


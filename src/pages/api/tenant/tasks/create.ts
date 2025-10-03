import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Task Management
const CreateTaskSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    title: z.string(),
    description: z.string().optional(),
    task_type: z.enum(['follow_up', 'appointment', 'reminder', 'administrative', 'field_work']),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    assigned_to: z.string(),
    due_date: z.string(),
    estimated_duration_minutes: z.number().positive().optional(),
    related_entity_type: z.enum(['lead', 'customer', 'work_order', 'estimate']).optional(),
    related_entity_id: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateTaskSchema.safeParse(req.body);
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

    // Validate assigned user exists
    const assignedUser = await prisma.user.findFirst({
      where: { id: payload.assigned_to, orgId },
    });

    if (!assignedUser) {
      return res.status(404).json({
        error: 'ASSIGNED_USER_NOT_FOUND',
        message: 'Assigned user not found',
      });
    }

    const task = await prisma.note.create({
      data: {
        orgId,
        entityType: 'task',
        entityId: `TSK-${Date.now()}`,
        userId: actor.user_id,
        body: `TASK: ${payload.title} - ${payload.description} (${payload.task_type}, ${payload.priority} priority) - Due: ${payload.due_date}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.task.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_task',
        resource: `task:${task.id}`,
        meta: { 
          title: payload.title,
          task_type: payload.task_type,
          priority: payload.priority,
          assigned_to: payload.assigned_to,
          due_date: payload.due_date,
          related_entity_type: payload.related_entity_type,
          related_entity_id: payload.related_entity_id 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `TSK-${task.id.substring(0, 6)}`,
        version: 1,
      },
      task: {
        id: task.id,
        title: payload.title,
        description: payload.description,
        task_type: payload.task_type,
        priority: payload.priority,
        assigned_to: payload.assigned_to,
        assigned_to_name: assignedUser.name,
        created_by: actor.user_id,
        due_date: payload.due_date,
        estimated_duration_minutes: payload.estimated_duration_minutes,
        related_entity_type: payload.related_entity_type,
        related_entity_id: payload.related_entity_id,
        tags: payload.tags,
        status: 'pending',
        created_at: task.createdAt.toISOString(),
      },
      audit_id: `AUD-TSK-${task.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create task',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

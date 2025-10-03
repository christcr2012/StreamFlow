import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Workflow Automation
const CreateWorkflowSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    name: z.string(),
    description: z.string().optional(),
    trigger_type: z.enum(['manual', 'scheduled', 'event_based', 'condition_based']),
    trigger_config: z.object({
      event: z.string().optional(),
      schedule: z.string().optional(), // cron expression
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
        value: z.any(),
      })).optional(),
    }),
    steps: z.array(z.object({
      step_type: z.enum(['notification', 'task_creation', 'status_update', 'api_call', 'approval']),
      config: z.object({
        recipient: z.string().optional(),
        message: z.string().optional(),
        task_template: z.string().optional(),
        status_value: z.string().optional(),
        api_endpoint: z.string().optional(),
        approver: z.string().optional(),
      }),
      delay_minutes: z.number().min(0).default(0),
    })),
    active: z.boolean().default(true),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateWorkflowSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only managers and owners can create workflows',
      });
    }

    // Validate workflow steps
    if (payload.steps.length === 0) {
      return res.status(400).json({
        error: 'INVALID_WORKFLOW',
        message: 'Workflow must have at least one step',
      });
    }

    // Validate cron expression if scheduled
    if (payload.trigger_type === 'scheduled' && !payload.trigger_config.schedule) {
      return res.status(400).json({
        error: 'MISSING_SCHEDULE',
        message: 'Schedule is required for scheduled workflows',
      });
    }

    const workflowId = `WFL-${Date.now()}`;

    const workflow = await prisma.note.create({
      data: {
        orgId,
        entityType: 'workflow',
        entityId: workflowId,
        userId: actor.user_id,
        body: `WORKFLOW: ${payload.name} - ${payload.description} (${payload.trigger_type}, ${payload.steps.length} steps)`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.workflow.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_workflow',
        resource: `workflow:${workflow.id}`,
        meta: { 
          name: payload.name,
          trigger_type: payload.trigger_type,
          steps_count: payload.steps.length,
          active: payload.active,
          priority: payload.priority 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `WFL-${workflow.id.substring(0, 6)}`,
        version: 1,
      },
      workflow: {
        id: workflow.id,
        workflow_id: workflowId,
        name: payload.name,
        description: payload.description,
        trigger_type: payload.trigger_type,
        trigger_config: payload.trigger_config,
        steps: payload.steps,
        steps_count: payload.steps.length,
        active: payload.active,
        priority: payload.priority,
        status: 'created',
        created_at: workflow.createdAt.toISOString(),
      },
      audit_id: `AUD-WFL-${workflow.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create workflow',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AIConciergeSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    action: z.enum(['toggle_feature', 'create_estimate', 'summarize_thread', 'draft_reply', 'schedule_visit']),
    parameters: z.object({
      feature_key: z.string().optional(),
      note_id: z.string().optional(),
      thread_id: z.string().optional(),
      tone: z.enum(['professional', 'friendly', 'urgent', 'casual']).optional(),
      job_id: z.string().optional(),
      time_window: z.string().optional(),
    }),
    budget_limit_cents: z.number().int().positive().default(1000), // $10 default
    require_owner_approval: z.boolean().default(true),
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

    const validation = AIConciergeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Check user role for owner approval requirement
    const user = await prisma.user.findFirst({
      where: { id: userId, orgId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    if (payload.require_owner_approval && user.role !== 'OWNER') {
      return res.status(403).json({
        error: 'OWNER_APPROVAL_REQUIRED',
        message: 'This AI action requires owner approval',
      });
    }

    // Check budget limits
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyUsage = await prisma.aiMonthlySummary.findFirst({
      where: {
        orgId,
        monthKey: currentMonth,
      },
    });

    const currentSpend = monthlyUsage ? Number(monthlyUsage.costUsd) * 100 : 0; // Convert USD to cents
    if (currentSpend + payload.budget_limit_cents > 10000) { // $100 monthly limit
      return res.status(422).json({
        error: 'BUDGET_EXCEEDED',
        message: 'Monthly AI budget limit would be exceeded',
      });
    }

    // Simulate AI action execution (in real implementation, this would call actual AI services)
    let actionResult;
    let estimatedCostCents = 50; // Base cost

    switch (payload.action) {
      case 'toggle_feature':
        actionResult = {
          feature_key: payload.parameters.feature_key,
          previous_state: 'disabled',
          new_state: 'enabled',
          message: `Feature ${payload.parameters.feature_key} has been enabled`,
        };
        estimatedCostCents = 10;
        break;

      case 'create_estimate':
        actionResult = {
          note_id: payload.parameters.note_id,
          estimate_id: `EST-${Date.now()}`,
          line_items: [
            { description: 'Service Call', amount_cents: 15000 },
            { description: 'Labor (2 hours)', amount_cents: 20000 },
          ],
          total_cents: 35000,
          message: 'Estimate created from note analysis',
        };
        estimatedCostCents = 200;
        break;

      case 'summarize_thread':
        actionResult = {
          thread_id: payload.parameters.thread_id,
          summary: 'Customer reported heating issue. Technician scheduled for tomorrow. Parts may be needed.',
          key_points: ['Heating system malfunction', 'Urgent repair needed', 'Customer available tomorrow'],
          message: 'Thread summarized successfully',
        };
        estimatedCostCents = 75;
        break;

      case 'draft_reply':
        actionResult = {
          thread_id: payload.parameters.thread_id,
          tone: payload.parameters.tone,
          draft_message: `Thank you for contacting us. We understand your concern and will have a technician available to assist you promptly.`,
          message: `Reply drafted in ${payload.parameters.tone} tone`,
        };
        estimatedCostCents = 100;
        break;

      case 'schedule_visit':
        actionResult = {
          job_id: payload.parameters.job_id,
          time_window: payload.parameters.time_window,
          scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'Visit scheduled successfully',
        };
        estimatedCostCents = 25;
        break;
    }

    // Create AI usage record
    const newCostUsd = (currentSpend + estimatedCostCents) / 100; // Convert cents to USD
    const aiUsage = await prisma.aiMonthlySummary.upsert({
      where: {
        orgId_monthKey: {
          orgId,
          monthKey: currentMonth,
        },
      },
      update: {
        costUsd: newCostUsd,
        callCount: (monthlyUsage?.callCount || 0) + 1,
        updatedAt: new Date(),
      },
      create: {
        orgId,
        monthKey: currentMonth,
        costUsd: estimatedCostCents / 100,
        callCount: 1,
      },
    });

    // Log AI action
    await prisma.note.create({
      data: {
        orgId,
        entityType: 'ai_action',
        entityId: aiUsage.id,
        userId,
        body: `AI CONCIERGE MAX: Executed ${payload.action} action. Cost: $${(estimatedCostCents / 100).toFixed(2)}. Monthly total: $${Number(aiUsage.costUsd).toFixed(2)}`,
        isPinned: estimatedCostCents > 100,
      },
    });

    await auditService.logBinderEvent({
      action: 'ai.concierge.execute',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: user.role,
        action: 'ai_concierge_action',
        resource: `ai_usage:${aiUsage.id}`,
        meta: {
          action: payload.action,
          parameters: payload.parameters,
          cost_cents: estimatedCostCents,
          monthly_total_cents: Number(aiUsage.costUsd) * 100,
          budget_limit_cents: payload.budget_limit_cents,
          require_owner_approval: payload.require_owner_approval,
        },
      },
    });

    const actionId = `AI-${Date.now()}`;

    return res.status(200).json({
      status: 'ok',
      result: {
        id: actionId,
        version: 1,
      },
      ai_action: {
        id: actionId,
        action: payload.action,
        result: actionResult,
        cost_cents: estimatedCostCents,
        cost_dollars: (estimatedCostCents / 100).toFixed(2),
        monthly_usage: {
          total_cost_cents: Number(aiUsage.costUsd) * 100,
          total_cost_dollars: Number(aiUsage.costUsd).toFixed(2),
          request_count: aiUsage.callCount,
          budget_remaining_cents: 10000 - (Number(aiUsage.costUsd) * 100),
        },
        executed_by: userId,
        executed_at: new Date(),
      },
      audit_id: `AUD-AI-${actionId}`,
    });
  } catch (error) {
    console.error('Error executing AI Concierge action:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to execute AI Concierge action',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

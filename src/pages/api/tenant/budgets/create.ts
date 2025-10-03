import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Budget Management
const CreateBudgetSchema = z.object({
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
    budget_type: z.enum(['operational', 'project', 'department', 'marketing', 'capital', 'maintenance']),
    period: z.object({
      start_date: z.string(),
      end_date: z.string(),
      fiscal_year: z.string().optional(),
    }),
    total_amount_cents: z.number().positive(),
    currency: z.string().default('USD'),
    categories: z.array(z.object({
      name: z.string(),
      allocated_amount_cents: z.number().positive(),
      description: z.string().optional(),
      subcategories: z.array(z.object({
        name: z.string(),
        allocated_amount_cents: z.number().positive(),
        description: z.string().optional(),
      })).default([]),
    })),
    responsible_manager: z.string(),
    approval_workflow: z.object({
      required: z.boolean().default(true),
      approvers: z.array(z.string()),
      approval_threshold_cents: z.number().positive().optional(),
    }),
    monitoring: z.object({
      alert_thresholds: z.array(z.object({
        percentage: z.number().min(0).max(100),
        alert_type: z.enum(['warning', 'critical']),
        recipients: z.array(z.string()),
      })).default([]),
      reporting_frequency: z.enum(['weekly', 'monthly', 'quarterly']).default('monthly'),
    }).default({}),
    variance_tolerance_percentage: z.number().min(0).max(100).default(10),
    rollover_policy: z.enum(['none', 'partial', 'full']).default('none'),
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
    const validation = CreateBudgetSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create budgets',
      });
    }

    // Validate period dates
    const startDate = new Date(payload.period.start_date);
    const endDate = new Date(payload.period.end_date);

    if (endDate <= startDate) {
      return res.status(422).json({
        error: 'INVALID_PERIOD',
        message: 'End date must be after start date',
      });
    }

    // Validate responsible manager
    const manager = await prisma.user.findFirst({
      where: { id: payload.responsible_manager, orgId, role: { in: ['MANAGER', 'OWNER'] } },
    });

    if (!manager) {
      return res.status(404).json({
        error: 'MANAGER_NOT_FOUND',
        message: 'Responsible manager not found or insufficient permissions',
      });
    }

    // Validate category allocations sum to total
    const totalAllocated = payload.categories.reduce((sum, category) => {
      const categoryTotal = category.allocated_amount_cents + 
        category.subcategories.reduce((subSum, sub) => subSum + sub.allocated_amount_cents, 0);
      return sum + categoryTotal;
    }, 0);

    if (totalAllocated > payload.total_amount_cents) {
      return res.status(422).json({
        error: 'OVER_ALLOCATED',
        message: 'Category allocations exceed total budget amount',
        total_budget_cents: payload.total_amount_cents,
        total_allocated_cents: totalAllocated,
        difference_cents: totalAllocated - payload.total_amount_cents,
      });
    }

    // Validate approvers
    if (payload.approval_workflow.required && payload.approval_workflow.approvers.length > 0) {
      const approvers = await prisma.user.findMany({
        where: { id: { in: payload.approval_workflow.approvers }, orgId, role: { in: ['MANAGER', 'OWNER'] } },
      });

      if (approvers.length !== payload.approval_workflow.approvers.length) {
        return res.status(404).json({
          error: 'APPROVERS_NOT_FOUND',
          message: 'One or more approvers not found or insufficient permissions',
        });
      }
    }

    const budgetId = `BUD-${Date.now()}`;

    const budget = await prisma.note.create({
      data: {
        orgId,
        entityType: 'budget',
        entityId: budgetId,
        userId: actor.user_id,
        body: `BUDGET: ${payload.name} - ${payload.description} (${payload.budget_type}, $${(payload.total_amount_cents / 100).toFixed(2)})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.budget.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_budget',
        resource: `budget:${budget.id}`,
        meta: { 
          name: payload.name,
          budget_type: payload.budget_type,
          total_amount_cents: payload.total_amount_cents,
          responsible_manager: payload.responsible_manager,
          categories_count: payload.categories.length,
          period_start: payload.period.start_date,
          period_end: payload.period.end_date 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `BUD-${budget.id.substring(0, 6)}`,
        version: 1,
      },
      budget: {
        id: budget.id,
        budget_id: budgetId,
        name: payload.name,
        description: payload.description,
        budget_type: payload.budget_type,
        period: payload.period,
        total_amount_cents: payload.total_amount_cents,
        total_amount_usd: (payload.total_amount_cents / 100).toFixed(2),
        currency: payload.currency,
        categories: payload.categories.map(cat => ({
          ...cat,
          allocated_amount_usd: (cat.allocated_amount_cents / 100).toFixed(2),
          subcategories: cat.subcategories.map(sub => ({
            ...sub,
            allocated_amount_usd: (sub.allocated_amount_cents / 100).toFixed(2),
          })),
        })),
        categories_count: payload.categories.length,
        total_allocated_cents: totalAllocated,
        total_allocated_usd: (totalAllocated / 100).toFixed(2),
        remaining_cents: payload.total_amount_cents - totalAllocated,
        remaining_usd: ((payload.total_amount_cents - totalAllocated) / 100).toFixed(2),
        responsible_manager: payload.responsible_manager,
        responsible_manager_name: manager.name,
        approval_workflow: payload.approval_workflow,
        monitoring: payload.monitoring,
        variance_tolerance_percentage: payload.variance_tolerance_percentage,
        rollover_policy: payload.rollover_policy,
        tags: payload.tags,
        status: payload.approval_workflow.required ? 'pending_approval' : 'active',
        spent_amount_cents: 0,
        spent_amount_usd: '0.00',
        utilization_percentage: 0,
        created_at: budget.createdAt.toISOString(),
      },
      audit_id: `AUD-BUD-${budget.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create budget',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

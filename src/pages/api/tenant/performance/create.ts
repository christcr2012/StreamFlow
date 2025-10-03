import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Performance Management
const CreatePerformanceReviewSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    employee_id: z.string(),
    review_period_start: z.string(),
    review_period_end: z.string(),
    review_type: z.enum(['annual', 'quarterly', 'probationary', 'project_based', 'disciplinary']),
    reviewer_id: z.string(),
    goals: z.array(z.object({
      description: z.string(),
      target: z.string(),
      weight: z.number().min(0).max(100),
      achievement: z.enum(['exceeded', 'met', 'partially_met', 'not_met']).optional(),
      comments: z.string().optional(),
    })),
    competencies: z.array(z.object({
      name: z.string(),
      description: z.string(),
      rating: z.enum(['outstanding', 'exceeds', 'meets', 'below', 'unsatisfactory']).optional(),
      comments: z.string().optional(),
    })),
    overall_rating: z.enum(['outstanding', 'exceeds_expectations', 'meets_expectations', 'below_expectations', 'unsatisfactory']).optional(),
    strengths: z.array(z.string()).default([]),
    areas_for_improvement: z.array(z.string()).default([]),
    development_plan: z.string().optional(),
    career_aspirations: z.string().optional(),
    manager_comments: z.string().optional(),
    employee_comments: z.string().optional(),
    status: z.enum(['draft', 'pending_employee_review', 'pending_manager_approval', 'completed']).default('draft'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreatePerformanceReviewSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create performance reviews',
      });
    }

    // Validate employee exists
    const employee = await prisma.user.findFirst({
      where: { id: payload.employee_id, orgId },
    });

    if (!employee) {
      return res.status(404).json({
        error: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found',
      });
    }

    // Validate reviewer exists
    const reviewer = await prisma.user.findFirst({
      where: { id: payload.reviewer_id, orgId, role: { in: ['MANAGER', 'OWNER'] } },
    });

    if (!reviewer) {
      return res.status(404).json({
        error: 'REVIEWER_NOT_FOUND',
        message: 'Reviewer not found or insufficient permissions',
      });
    }

    // Validate review period
    const startDate = new Date(payload.review_period_start);
    const endDate = new Date(payload.review_period_end);

    if (endDate <= startDate) {
      return res.status(422).json({
        error: 'INVALID_REVIEW_PERIOD',
        message: 'Review period end date must be after start date',
      });
    }

    // Validate goal weights sum to 100
    const totalWeight = payload.goals.reduce((sum, goal) => sum + goal.weight, 0);
    if (totalWeight !== 100) {
      return res.status(422).json({
        error: 'INVALID_GOAL_WEIGHTS',
        message: 'Goal weights must sum to 100%',
      });
    }

    const reviewId = `PRF-${Date.now()}`;

    const performanceReview = await prisma.note.create({
      data: {
        orgId,
        entityType: 'performance_review',
        entityId: reviewId,
        userId: actor.user_id,
        body: `PERFORMANCE REVIEW: ${employee.name} - ${payload.review_type} (${payload.review_period_start} to ${payload.review_period_end})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.performance.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_performance_review',
        resource: `performance_review:${performanceReview.id}`,
        meta: { 
          employee_id: payload.employee_id,
          review_type: payload.review_type,
          reviewer_id: payload.reviewer_id,
          review_period_start: payload.review_period_start,
          review_period_end: payload.review_period_end,
          goals_count: payload.goals.length,
          competencies_count: payload.competencies.length 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `PRF-${performanceReview.id.substring(0, 6)}`,
        version: 1,
      },
      performance_review: {
        id: performanceReview.id,
        review_id: reviewId,
        employee_id: payload.employee_id,
        employee_name: employee.name,
        review_period_start: payload.review_period_start,
        review_period_end: payload.review_period_end,
        review_type: payload.review_type,
        reviewer_id: payload.reviewer_id,
        reviewer_name: reviewer.name,
        goals: payload.goals,
        goals_count: payload.goals.length,
        competencies: payload.competencies,
        competencies_count: payload.competencies.length,
        overall_rating: payload.overall_rating,
        strengths: payload.strengths,
        areas_for_improvement: payload.areas_for_improvement,
        development_plan: payload.development_plan,
        career_aspirations: payload.career_aspirations,
        manager_comments: payload.manager_comments,
        employee_comments: payload.employee_comments,
        status: payload.status,
        created_at: performanceReview.createdAt.toISOString(),
      },
      audit_id: `AUD-PRF-${performanceReview.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating performance review:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create performance review',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

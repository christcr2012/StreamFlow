import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Survey Management
const CreateSurveySchema = z.object({
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
    survey_type: z.enum(['customer_satisfaction', 'employee_feedback', 'quality_assessment', 'market_research', 'compliance_check']),
    target_audience: z.enum(['customers', 'employees', 'vendors', 'public', 'specific_group']),
    questions: z.array(z.object({
      question_text: z.string(),
      question_type: z.enum(['multiple_choice', 'text', 'rating', 'yes_no', 'scale', 'date']),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(),
      scale_min: z.number().optional(),
      scale_max: z.number().optional(),
      validation_rules: z.object({
        min_length: z.number().optional(),
        max_length: z.number().optional(),
        pattern: z.string().optional(),
      }).optional(),
    })),
    distribution: z.object({
      method: z.enum(['email', 'sms', 'web_link', 'qr_code', 'in_app']),
      recipients: z.array(z.string()).default([]),
      schedule: z.object({
        start_date: z.string(),
        end_date: z.string().optional(),
        reminder_frequency: z.enum(['none', 'daily', 'weekly']).default('none'),
      }),
    }),
    anonymity: z.boolean().default(true),
    response_limit: z.number().positive().optional(),
    incentive: z.object({
      type: z.enum(['none', 'discount', 'gift_card', 'points', 'entry_to_draw']).default('none'),
      value: z.string().optional(),
      description: z.string().optional(),
    }).default({}),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateSurveySchema.safeParse(req.body);
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
        message: 'Only managers and owners can create surveys',
      });
    }

    // Validate questions
    if (payload.questions.length === 0) {
      return res.status(400).json({
        error: 'NO_QUESTIONS',
        message: 'Survey must have at least one question',
      });
    }

    // Validate distribution dates
    const startDate = new Date(payload.distribution.schedule.start_date);
    const endDate = payload.distribution.schedule.end_date ? new Date(payload.distribution.schedule.end_date) : null;

    if (endDate && endDate <= startDate) {
      return res.status(422).json({
        error: 'INVALID_DATE_RANGE',
        message: 'End date must be after start date',
      });
    }

    // Validate recipients if specified
    if (payload.distribution.recipients.length > 0) {
      const recipients = await prisma.user.findMany({
        where: { id: { in: payload.distribution.recipients }, orgId },
      });

      if (recipients.length !== payload.distribution.recipients.length) {
        return res.status(404).json({
          error: 'RECIPIENTS_NOT_FOUND',
          message: 'One or more recipients not found',
        });
      }
    }

    const surveyId = `SUR-${Date.now()}`;

    const survey = await prisma.note.create({
      data: {
        orgId,
        entityType: 'survey',
        entityId: surveyId,
        userId: actor.user_id,
        body: `SURVEY: ${payload.title} - ${payload.description} (${payload.survey_type}, ${payload.questions.length} questions)`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.survey.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_survey',
        resource: `survey:${survey.id}`,
        meta: { 
          title: payload.title,
          survey_type: payload.survey_type,
          target_audience: payload.target_audience,
          questions_count: payload.questions.length,
          distribution_method: payload.distribution.method,
          anonymity: payload.anonymity 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `SUR-${survey.id.substring(0, 6)}`,
        version: 1,
      },
      survey: {
        id: survey.id,
        survey_id: surveyId,
        title: payload.title,
        description: payload.description,
        survey_type: payload.survey_type,
        target_audience: payload.target_audience,
        questions: payload.questions,
        questions_count: payload.questions.length,
        required_questions_count: payload.questions.filter(q => q.required).length,
        distribution: payload.distribution,
        anonymity: payload.anonymity,
        response_limit: payload.response_limit,
        incentive: payload.incentive,
        status: 'draft',
        responses_count: 0,
        created_at: survey.createdAt.toISOString(),
      },
      audit_id: `AUD-SUR-${survey.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create survey',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Marketing Campaign Management
const CreateCampaignSchema = z.object({
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
    campaign_type: z.enum(['email', 'sms', 'direct_mail', 'social_media', 'referral', 'promotional', 'retention']),
    objective: z.enum(['lead_generation', 'customer_retention', 'brand_awareness', 'sales_promotion', 'service_announcement']),
    target_audience: z.object({
      criteria: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in_range']),
        value: z.any(),
      })),
      estimated_reach: z.number().positive().optional(),
      segments: z.array(z.string()).default([]),
    }),
    content: z.object({
      subject: z.string().optional(),
      message: z.string(),
      call_to_action: z.string().optional(),
      landing_page_url: z.string().url().optional(),
      attachments: z.array(z.string()).default([]),
    }),
    schedule: z.object({
      start_date: z.string(),
      end_date: z.string().optional(),
      send_time: z.string().optional(),
      timezone: z.string().default('UTC'),
      frequency: z.enum(['one_time', 'daily', 'weekly', 'monthly']).default('one_time'),
    }),
    budget: z.object({
      total_budget_cents: z.number().min(0).default(0),
      cost_per_contact_cents: z.number().min(0).optional(),
      estimated_cost_cents: z.number().min(0).optional(),
    }).default({}),
    tracking: z.object({
      track_opens: z.boolean().default(true),
      track_clicks: z.boolean().default(true),
      track_conversions: z.boolean().default(true),
      utm_parameters: z.object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        term: z.string().optional(),
        content: z.string().optional(),
      }).optional(),
    }).default({}),
    approval_required: z.boolean().default(false),
    approvers: z.array(z.string()).default([]),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateCampaignSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create campaigns',
      });
    }

    // Validate schedule dates
    const startDate = new Date(payload.schedule.start_date);
    const endDate = payload.schedule.end_date ? new Date(payload.schedule.end_date) : null;

    if (endDate && endDate <= startDate) {
      return res.status(422).json({
        error: 'INVALID_DATE_RANGE',
        message: 'End date must be after start date',
      });
    }

    // Validate approvers if approval is required
    if (payload.approval_required && payload.approvers.length > 0) {
      const approvers = await prisma.user.findMany({
        where: { id: { in: payload.approvers }, orgId, role: { in: ['MANAGER', 'OWNER'] } },
      });

      if (approvers.length !== payload.approvers.length) {
        return res.status(404).json({
          error: 'APPROVERS_NOT_FOUND',
          message: 'One or more approvers not found or insufficient permissions',
        });
      }
    }

    // Validate target audience criteria
    if (payload.target_audience.criteria.length === 0) {
      return res.status(400).json({
        error: 'NO_TARGET_CRITERIA',
        message: 'Campaign must have at least one target audience criteria',
      });
    }

    const campaignId = `CAM-${Date.now()}`;

    const campaign = await prisma.note.create({
      data: {
        orgId,
        entityType: 'campaign',
        entityId: campaignId,
        userId: actor.user_id,
        body: `CAMPAIGN: ${payload.name} - ${payload.description} (${payload.campaign_type}, ${payload.objective})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.campaign.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_campaign',
        resource: `campaign:${campaign.id}`,
        meta: { 
          name: payload.name,
          campaign_type: payload.campaign_type,
          objective: payload.objective,
          target_criteria_count: payload.target_audience.criteria.length,
          estimated_reach: payload.target_audience.estimated_reach,
          total_budget_cents: payload.budget.total_budget_cents 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `CAM-${campaign.id.substring(0, 6)}`,
        version: 1,
      },
      campaign: {
        id: campaign.id,
        campaign_id: campaignId,
        name: payload.name,
        description: payload.description,
        campaign_type: payload.campaign_type,
        objective: payload.objective,
        target_audience: payload.target_audience,
        content: payload.content,
        schedule: payload.schedule,
        budget: {
          ...payload.budget,
          total_budget_usd: (payload.budget.total_budget_cents / 100).toFixed(2),
          cost_per_contact_usd: payload.budget.cost_per_contact_cents ? (payload.budget.cost_per_contact_cents / 100).toFixed(2) : null,
          estimated_cost_usd: payload.budget.estimated_cost_cents ? (payload.budget.estimated_cost_cents / 100).toFixed(2) : null,
        },
        tracking: payload.tracking,
        approval_required: payload.approval_required,
        approvers: payload.approvers,
        status: payload.approval_required ? 'pending_approval' : 'draft',
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          unsubscribed: 0,
        },
        created_at: campaign.createdAt.toISOString(),
      },
      audit_id: `AUD-CAM-${campaign.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create campaign',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

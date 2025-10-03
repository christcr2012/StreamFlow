import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withCostGuard } from '@/middleware/costGuard';
import { auditService } from '@/lib/auditService';
import { z } from 'zod';

const ScheduleOptimizeSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    jobs: z.array(z.object({
      id: z.string(),
      priority: z.number().min(1).max(5),
      estimated_duration: z.number(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      skills_required: z.array(z.string()),
      time_window: z.object({
        start: z.string(),
        end: z.string(),
      }).optional(),
    })),
    technicians: z.array(z.object({
      id: z.string(),
      skills: z.array(z.string()),
      availability: z.object({
        start: z.string(),
        end: z.string(),
      }),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    })),
    constraints: z.object({
      max_travel_time: z.number().default(60), // minutes
      prefer_skill_match: z.boolean().default(true),
      allow_overtime: z.boolean().default(false),
    }).optional(),
  }),
  tier: z.enum(['Eco', 'Full']).default('Eco'),
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
    const validation = ScheduleOptimizeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, tier, idempotency_key } = validation.data;

    // Prepare AI prompt payload
    const promptPayload = {
      task: 'schedule_optimize',
      tier,
      budget_tokens: tier === 'Eco' ? 900 : 2000,
      inputs: [
        'tenant_config',
        'historical_data',
        'current_context',
      ],
      redactions: ['PII', 'card_data'],
      fallback: 'rules_template_v1',
      on_insufficient_credits: 'offer_prepay_or_downgrade',
      log_costs: true,
      data: {
        jobs: payload.jobs,
        technicians: payload.technicians,
        constraints: payload.constraints || {},
      },
    };

    // Mock AI processing (in real implementation would call AI service)
    await new Promise(resolve => setTimeout(resolve, tier === 'Eco' ? 1500 : 3000));

    // Generate optimized schedule (mock implementation)
    const optimizedSchedule = payload.jobs.map((job, index) => ({
      job_id: job.id,
      technician_id: payload.technicians[index % payload.technicians.length]?.id,
      scheduled_start: new Date(Date.now() + index * 60 * 60 * 1000).toISOString(),
      estimated_end: new Date(Date.now() + index * 60 * 60 * 1000 + job.estimated_duration * 60 * 1000).toISOString(),
      travel_time: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
      confidence_score: Math.floor(Math.random() * 30) + 70, // 70-100%
    }));

    const metrics = {
      total_jobs: payload.jobs.length,
      scheduled_jobs: optimizedSchedule.length,
      avg_confidence: Math.floor(optimizedSchedule.reduce((sum, s) => sum + s.confidence_score, 0) / optimizedSchedule.length),
      total_travel_time: optimizedSchedule.reduce((sum, s) => sum + s.travel_time, 0),
      efficiency_score: Math.floor(Math.random() * 20) + 80, // 80-100%
    };

    // Calculate costs
    const tokenCost = tier === 'Eco' ? 850 : 1800;
    const centsCost = Math.floor(tokenCost * 0.002); // ~$0.002 per token

    // Audit log
    await auditService.logBinderEvent({
      action: 'ai.schedule_optimize',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: request_id,
        version: 1,
      },
      schedule: {
        optimized_assignments: optimizedSchedule,
        metrics,
        tier,
        fallback_used: false,
      },
      audit_id: `AUD-SCH-${request_id}`,
      cost: {
        ai_tokens: tokenCost,
        cents: centsCost,
      },
    });
  } catch (error) {
    console.error('Error in schedule optimization:', error);
    await auditService.logBinderEvent({
      action: 'ai.schedule_optimize.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to optimize schedule',
    });
  }
}

export default withAudience(
  'tenant',
  withCostGuard(
    handler,
    [
      {
        type: 'ai_tokens',
        estimate: (req) => {
          const tier = req.body?.tier || 'Eco';
          return tier === 'Eco' ? 900 : 2000;
        }
      }
    ]
  )
);

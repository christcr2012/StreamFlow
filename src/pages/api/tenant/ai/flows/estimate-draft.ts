import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withCostGuard } from '@/middleware/costGuard';
import { auditService } from '@/lib/auditService';
import { z } from 'zod';

const EstimateDraftSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    job_type: z.string(),
    location: z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
    }),
    scope: z.object({
      description: z.string(),
      square_footage: z.number().optional(),
      rooms: z.number().optional(),
      special_requirements: z.array(z.string()).optional(),
    }),
    customer: z.object({
      name: z.string(),
      contact_info: z.object({
        phone: z.string(),
        email: z.string(),
      }),
      property_type: z.enum(['residential', 'commercial', 'industrial']),
    }),
    urgency: z.enum(['standard', 'urgent', 'emergency']).default('standard'),
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
    const validation = EstimateDraftSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, tier, idempotency_key } = validation.data;

    // Prepare AI prompt payload
    const promptPayload = {
      task: 'estimate_draft',
      tier,
      budget_tokens: tier === 'Eco' ? 800 : 1800,
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
        job_type: payload.job_type,
        location: payload.location,
        scope: payload.scope,
        customer: {
          property_type: payload.customer.property_type,
          // Redact PII
        },
        urgency: payload.urgency,
      },
    };

    // Mock AI processing (in real implementation would call AI service)
    await new Promise(resolve => setTimeout(resolve, tier === 'Eco' ? 1200 : 2500));

    // Generate estimate draft (mock implementation)
    const basePrice = payload.scope.square_footage ? 
      payload.scope.square_footage * (payload.job_type === 'cleaning' ? 0.15 : 0.25) :
      500; // Default base price

    const urgencyMultiplier = {
      standard: 1.0,
      urgent: 1.25,
      emergency: 1.5,
    }[payload.urgency];

    const propertyMultiplier = {
      residential: 1.0,
      commercial: 1.2,
      industrial: 1.4,
    }[payload.customer.property_type];

    const estimatedTotal = Math.round(basePrice * urgencyMultiplier * propertyMultiplier);

    const estimate = {
      line_items: [
        {
          description: `${payload.job_type} service`,
          quantity: payload.scope.square_footage || 1,
          unit: payload.scope.square_footage ? 'sq ft' : 'job',
          unit_price: payload.scope.square_footage ? 
            Math.round(basePrice / payload.scope.square_footage * 100) / 100 : 
            basePrice,
          total: Math.round(basePrice),
        },
        ...(payload.urgency !== 'standard' ? [{
          description: `${payload.urgency} service surcharge`,
          quantity: 1,
          unit: 'job',
          unit_price: Math.round(basePrice * (urgencyMultiplier - 1)),
          total: Math.round(basePrice * (urgencyMultiplier - 1)),
        }] : []),
        ...(payload.customer.property_type !== 'residential' ? [{
          description: `${payload.customer.property_type} property adjustment`,
          quantity: 1,
          unit: 'job',
          unit_price: Math.round(basePrice * (propertyMultiplier - 1)),
          total: Math.round(basePrice * (propertyMultiplier - 1)),
        }] : []),
      ],
      subtotal: estimatedTotal,
      tax_rate: 0.08, // 8% tax
      tax_amount: Math.round(estimatedTotal * 0.08),
      total: Math.round(estimatedTotal * 1.08),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      confidence_level: tier === 'Eco' ? 'medium' : 'high',
      notes: tier === 'Eco' ? 
        'This is an AI-generated estimate. Upgrade to Full tier for detailed breakdown and higher accuracy.' :
        'Detailed estimate with comprehensive analysis and high accuracy.',
    };

    // Calculate costs
    const tokenCost = tier === 'Eco' ? 750 : 1650;
    const centsCost = Math.floor(tokenCost * 0.002); // ~$0.002 per token

    // Audit log
    await auditService.logBinderEvent({
      action: 'ai.estimate_draft',
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
      estimate,
      upgrade_available: tier === 'Eco',
      audit_id: `AUD-EST-${request_id}`,
      cost: {
        ai_tokens: tokenCost,
        cents: centsCost,
      },
    });
  } catch (error) {
    console.error('Error in estimate draft:', error);
    await auditService.logBinderEvent({
      action: 'ai.estimate_draft.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate estimate draft',
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
          return tier === 'Eco' ? 800 : 1800;
        }
      }
    ]
  )
);

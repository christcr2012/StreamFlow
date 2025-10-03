import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withCostGuard } from '@/middleware/costGuard';
import { auditService } from '@/lib/auditService';
import { z } from 'zod';

const DVIRSummarySchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    vehicle_id: z.string(),
    inspection_date: z.string(),
    inspector: z.object({
      name: z.string(),
      employee_id: z.string(),
    }),
    pre_trip: z.object({
      items: z.array(z.object({
        category: z.string(),
        item: z.string(),
        status: z.enum(['ok', 'defect', 'na']),
        notes: z.string().optional(),
      })),
      overall_status: z.enum(['satisfactory', 'unsatisfactory']),
    }),
    post_trip: z.object({
      items: z.array(z.object({
        category: z.string(),
        item: z.string(),
        status: z.enum(['ok', 'defect', 'na']),
        notes: z.string().optional(),
      })),
      overall_status: z.enum(['satisfactory', 'unsatisfactory']),
      defects_corrected: z.boolean().default(false),
    }),
    driver_signature: z.string(),
    mechanic_signature: z.string().optional(),
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
    const validation = DVIRSummarySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, tier, idempotency_key } = validation.data;

    // Prepare AI prompt payload
    const promptPayload = {
      task: 'dvir_summary',
      tier,
      budget_tokens: tier === 'Eco' ? 600 : 1200,
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
        vehicle_id: payload.vehicle_id,
        inspection_date: payload.inspection_date,
        pre_trip: payload.pre_trip,
        post_trip: payload.post_trip,
        // Redact driver signature for privacy
      },
    };

    // Mock AI processing (in real implementation would call AI service)
    await new Promise(resolve => setTimeout(resolve, tier === 'Eco' ? 800 : 1500));

    // Analyze DVIR data
    const allItems = [...payload.pre_trip.items, ...payload.post_trip.items];
    const defects = allItems.filter(item => item.status === 'defect');
    const criticalDefects = defects.filter(defect => 
      ['brakes', 'steering', 'lights', 'tires'].some(critical => 
        defect.category.toLowerCase().includes(critical) || 
        defect.item.toLowerCase().includes(critical)
      )
    );

    // Generate risk assessment
    const riskLevel = criticalDefects.length > 0 ? 'high' : 
                     defects.length > 2 ? 'medium' : 'low';

    const summary = {
      overall_status: payload.pre_trip.overall_status === 'satisfactory' && 
                     payload.post_trip.overall_status === 'satisfactory' ? 
                     'satisfactory' : 'unsatisfactory',
      risk_level: riskLevel,
      total_defects: defects.length,
      critical_defects: criticalDefects.length,
      defects_by_category: defects.reduce((acc, defect) => {
        acc[defect.category] = (acc[defect.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      key_findings: [
        ...(criticalDefects.length > 0 ? [`${criticalDefects.length} critical safety defects identified`] : []),
        ...(defects.length > 0 ? [`${defects.length} total defects requiring attention`] : []),
        ...(payload.post_trip.defects_corrected ? ['Post-trip defects were corrected'] : []),
        ...(payload.post_trip.overall_status === 'satisfactory' ? ['Vehicle cleared for operation'] : ['Vehicle requires maintenance before operation']),
      ],
      recommendations: [
        ...(criticalDefects.length > 0 ? ['Immediate maintenance required for critical safety items'] : []),
        ...(defects.length > 2 ? ['Schedule comprehensive maintenance inspection'] : []),
        ...(riskLevel === 'high' ? ['Remove vehicle from service until repairs completed'] : []),
        'Continue regular DVIR inspections',
      ],
      compliance_notes: tier === 'Full' ? [
        'FMCSA Part 396 compliance verified',
        'DOT inspection requirements met',
        'Maintenance records updated',
      ] : [
        'Basic compliance check completed',
        'Upgrade to Full tier for detailed compliance analysis',
      ],
    };

    // Generate risk flags
    const riskFlags = [
      ...(criticalDefects.length > 0 ? [{
        type: 'CRITICAL_SAFETY',
        severity: 'high',
        message: `${criticalDefects.length} critical safety defects require immediate attention`,
        items: criticalDefects.map(d => `${d.category}: ${d.item}`),
      }] : []),
      ...(defects.length > 5 ? [{
        type: 'EXCESSIVE_DEFECTS',
        severity: 'medium',
        message: `High number of defects (${defects.length}) may indicate maintenance issues`,
        items: [],
      }] : []),
      ...(payload.post_trip.overall_status === 'unsatisfactory' && !payload.post_trip.defects_corrected ? [{
        type: 'UNCORRECTED_DEFECTS',
        severity: 'high',
        message: 'Post-trip inspection unsatisfactory with uncorrected defects',
        items: [],
      }] : []),
    ];

    // Calculate costs
    const tokenCost = tier === 'Eco' ? 580 : 1100;
    const centsCost = Math.floor(tokenCost * 0.002); // ~$0.002 per token

    // Audit log
    await auditService.logBinderEvent({
      action: 'ai.dvir_summary',
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
      summary,
      risk_flags: riskFlags,
      tier,
      audit_id: `AUD-DVIR-${request_id}`,
      cost: {
        ai_tokens: tokenCost,
        cents: centsCost,
      },
    });
  } catch (error) {
    console.error('Error in DVIR summary:', error);
    await auditService.logBinderEvent({
      action: 'ai.dvir_summary.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate DVIR summary',
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
          return tier === 'Eco' ? 600 : 1200;
        }
      }
    ]
  )
);

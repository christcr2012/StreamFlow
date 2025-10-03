import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withCostGuard } from '@/middleware/costGuard';
import { auditService } from '@/lib/auditService';
import { z } from 'zod';

const FuelAnomalySchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    vehicle_id: z.string(),
    analysis_period: z.object({
      start_date: z.string(),
      end_date: z.string(),
    }),
    fuel_transactions: z.array(z.object({
      transaction_id: z.string(),
      date: z.string(),
      location: z.object({
        station_name: z.string(),
        address: z.string(),
        lat: z.number(),
        lng: z.number(),
      }),
      fuel_type: z.string(),
      gallons: z.number(),
      price_per_gallon: z.number(),
      total_cost: z.number(),
      odometer: z.number(),
      driver_id: z.string(),
    })),
    vehicle_data: z.object({
      make: z.string(),
      model: z.string(),
      year: z.number(),
      engine_type: z.string(),
      expected_mpg: z.number(),
    }),
    historical_baseline: z.object({
      avg_mpg: z.number(),
      avg_cost_per_mile: z.number(),
      typical_fuel_frequency: z.number(), // days between fills
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
    const validation = FuelAnomalySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, tier, idempotency_key } = validation.data;

    // Prepare AI prompt payload
    const promptPayload = {
      task: 'fuel_anomaly',
      tier,
      budget_tokens: tier === 'Eco' ? 700 : 1400,
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
        analysis_period: payload.analysis_period,
        fuel_transactions: payload.fuel_transactions.map(t => ({
          ...t,
          driver_id: '[REDACTED]', // Redact driver info
        })),
        vehicle_data: payload.vehicle_data,
        historical_baseline: payload.historical_baseline,
      },
    };

    // Mock AI processing (in real implementation would call AI service)
    await new Promise(resolve => setTimeout(resolve, tier === 'Eco' ? 1000 : 2000));

    // Analyze fuel data for anomalies
    const transactions = payload.fuel_transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const anomalies = [];
    const insights = [];

    // Calculate MPG for each transaction
    const mpgData = [];
    for (let i = 1; i < transactions.length; i++) {
      const current = transactions[i];
      const previous = transactions[i - 1];
      const milesDriven = current.odometer - previous.odometer;
      const mpg = milesDriven / previous.gallons;
      
      mpgData.push({
        transaction_id: current.transaction_id,
        date: current.date,
        mpg,
        gallons: previous.gallons,
        cost_per_gallon: previous.price_per_gallon,
        miles_driven: milesDriven,
      });

      // Check for MPG anomalies
      const expectedMpg = payload.historical_baseline?.avg_mpg || payload.vehicle_data.expected_mpg;
      if (mpg < expectedMpg * 0.7) { // 30% below expected
        anomalies.push({
          type: 'LOW_FUEL_EFFICIENCY',
          severity: 'medium',
          transaction_id: current.transaction_id,
          date: current.date,
          description: `Fuel efficiency ${mpg.toFixed(1)} MPG is significantly below expected ${expectedMpg.toFixed(1)} MPG`,
          impact: 'Increased fuel costs and potential maintenance issues',
          recommended_action: 'Schedule vehicle inspection for engine performance',
        });
      }

      // Check for excessive fuel consumption
      if (previous.gallons > 50 && payload.vehicle_data.engine_type !== 'diesel') {
        anomalies.push({
          type: 'EXCESSIVE_FUEL_PURCHASE',
          severity: 'high',
          transaction_id: previous.transaction_id,
          date: previous.date,
          description: `Unusually large fuel purchase: ${previous.gallons} gallons`,
          impact: 'Potential fuel theft or data entry error',
          recommended_action: 'Verify transaction and investigate with driver',
        });
      }

      // Check for price anomalies
      const avgPrice = transactions.reduce((sum, t) => sum + t.price_per_gallon, 0) / transactions.length;
      if (previous.price_per_gallon > avgPrice * 1.3) { // 30% above average
        anomalies.push({
          type: 'HIGH_FUEL_PRICE',
          severity: 'low',
          transaction_id: previous.transaction_id,
          date: previous.date,
          description: `Fuel price $${previous.price_per_gallon.toFixed(2)} is significantly above average $${avgPrice.toFixed(2)}`,
          impact: 'Increased fuel costs',
          recommended_action: 'Consider alternative fuel stations or bulk purchasing',
        });
      }
    }

    // Generate insights
    const totalGallons = transactions.reduce((sum, t) => sum + t.gallons, 0);
    const totalCost = transactions.reduce((sum, t) => sum + t.total_cost, 0);
    const avgMpg = mpgData.length > 0 ? mpgData.reduce((sum, d) => sum + d.mpg, 0) / mpgData.length : 0;
    const totalMiles = transactions.length > 1 ? 
      transactions[transactions.length - 1].odometer - transactions[0].odometer : 0;

    insights.push(
      `Analyzed ${transactions.length} fuel transactions over ${Math.ceil((new Date(payload.analysis_period.end_date).getTime() - new Date(payload.analysis_period.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`,
      `Total fuel consumed: ${totalGallons.toFixed(1)} gallons`,
      `Total fuel cost: $${totalCost.toFixed(2)}`,
      `Average fuel efficiency: ${avgMpg.toFixed(1)} MPG`,
      `Total miles driven: ${totalMiles.toLocaleString()} miles`,
      `Cost per mile: $${totalMiles > 0 ? (totalCost / totalMiles).toFixed(3) : '0.000'}`
    );

    if (tier === 'Full') {
      insights.push(
        `Fuel efficiency trend: ${avgMpg > (payload.historical_baseline?.avg_mpg || payload.vehicle_data.expected_mpg) ? 'improving' : 'declining'}`,
        `Cost optimization potential: ${anomalies.filter(a => a.type === 'HIGH_FUEL_PRICE').length > 0 ? 'high' : 'low'}`,
        `Maintenance recommendation: ${anomalies.filter(a => a.type === 'LOW_FUEL_EFFICIENCY').length > 0 ? 'required' : 'on schedule'}`
      );
    }

    const summary = {
      analysis_period: payload.analysis_period,
      total_transactions: transactions.length,
      total_anomalies: anomalies.length,
      anomalies_by_severity: {
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length,
      },
      fuel_metrics: {
        total_gallons: totalGallons,
        total_cost: totalCost,
        avg_mpg: avgMpg,
        total_miles: totalMiles,
        cost_per_mile: totalMiles > 0 ? totalCost / totalMiles : 0,
      },
      efficiency_rating: avgMpg > (payload.historical_baseline?.avg_mpg || payload.vehicle_data.expected_mpg) * 0.9 ? 'good' : 
                        avgMpg > (payload.historical_baseline?.avg_mpg || payload.vehicle_data.expected_mpg) * 0.8 ? 'fair' : 'poor',
    };

    // Calculate costs
    const tokenCost = tier === 'Eco' ? 680 : 1320;
    const centsCost = Math.floor(tokenCost * 0.002); // ~$0.002 per token

    // Audit log
    await auditService.logBinderEvent({
      action: 'ai.fuel_anomaly',
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
      analysis: {
        summary,
        anomalies: tier === 'Eco' ? anomalies.slice(0, 5) : anomalies, // Limit anomalies in Eco tier
        insights,
        tier,
      },
      audit_id: `AUD-FUEL-${request_id}`,
      cost: {
        ai_tokens: tokenCost,
        cents: centsCost,
      },
    });
  } catch (error) {
    console.error('Error in fuel anomaly detection:', error);
    await auditService.logBinderEvent({
      action: 'ai.fuel_anomaly.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to detect fuel anomalies',
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
          return tier === 'Eco' ? 700 : 1400;
        }
      }
    ]
  )
);

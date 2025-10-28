/**
 * Provider Portal - AI Usage API (PHASE 1 STUB)
 *
 * Issue: #258 - AI Cost Management for Provider Portal
 */

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month';

  console.log('[STUB][provider] GET /api/ai/usage - period:', period);

  return NextResponse.json({
    period,
    summary: {
      totalCost: 112.34,
      totalTokensIn: 987654,
      totalTokensOut: 543210,
      totalCalls: 2456,
      averageCostPerCall: 0.046
    },
    byApp: [
      { app: 'tenant-app', cost: 78.12, calls: 1734 },
      { app: 'provider-portal', cost: 34.22, calls: 722 }
    ],
    byFeature: [
      { feature: 'marketplace_matching', cost: 40.00, calls: 890, tokens: 345678 },
      { feature: 'pricing_optimization', cost: 22.34, calls: 567, tokens: 198765 },
      { feature: 'lead_scoring', cost: 18.45, calls: 456, tokens: 87654 },
      { feature: 'analytics_insights', cost: 31.55, calls: 543, tokens: 123456 }
    ],
    budget: {
      monthlyLimit: 250.00,
      currentSpend: 112.34,
      remaining: 137.66,
      percentUsed: 44.9,
      daysRemaining: 5,
      projectedEndOfMonth: 224.68,
      alertThreshold: 80,
      alertsEnabled: true
    }
  });
}

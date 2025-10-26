/**
 * Provider Portal - AI Budget API (PHASE 1 STUB)
 */

import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[STUB][provider] GET /api/ai/budget');

  return NextResponse.json({
    id: 'provider_budget_stub',
    monthlyBudget: 250.00,
    currentSpend: 112.34,
    alertThreshold: 80,
    hardLimit: false,
    resetDay: 1,
    status: 'healthy'
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  console.log('[STUB][provider] PUT /api/ai/budget', body);

  return NextResponse.json({ success: true, updated: { ...body, updatedAt: new Date().toISOString() } });
}

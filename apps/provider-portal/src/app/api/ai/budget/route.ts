/**
 * Provider Portal - AI Budget API (PHASE 1 STUB)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  console.log('[STUB][provider] GET /api/ai/budget');

  try {
    const cfg = await prisma.providerConfig.findFirst();
    const disabled = (cfg?.featureFlags as any)?.['ai-cost'] === false;
    if (disabled) return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  } catch (_) {
    // ignore flag lookup errors in phase 1
  }

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

  try {
    const cfg = await prisma.providerConfig.findFirst();
    const disabled = (cfg?.featureFlags as any)?.['ai-cost'] === false;
    if (disabled) return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  } catch (_) {}

  return NextResponse.json({ success: true, updated: { ...body, updatedAt: new Date().toISOString() } });
}

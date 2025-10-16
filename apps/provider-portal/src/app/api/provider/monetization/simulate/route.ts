import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * POST /api/provider/monetization/simulate
 * Computes impact of a monetization change without applying it.
 * Body: { scope: { type: 'provider' | 'plan' | 'tenant', planId?: string, orgId?: string }, change?: any }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const scope = body?.scope as { type?: 'provider'|'plan'|'tenant'; planId?: string; orgId?: string };

    if (!scope || !scope.type) {
      return NextResponse.json({ ok: false, error: 'missing_scope' }, { status: 400 });
    }

    if (scope.type === 'provider') {
      const tenantsAffected = await prisma.org.count();
      const sampleTenants = await prisma.org.findMany({ select: { id: true, name: true }, take: 5, orderBy: { createdAt: 'desc' } });
      return NextResponse.json({ ok: true, impact: { tenantsAffected, sampleTenants } });
    }

    if (scope.type === 'plan') {
      const planId = scope.planId || '';
      if (!planId) return NextResponse.json({ ok: false, error: 'missing_planId' }, { status: 400 });

      // Orgs explicitly assigned this plan
      const tenantsAffected = await prisma.org.count({ where: { pricingPlan: { id: planId } as any } });
      const sampleTenants = await prisma.org.findMany({ where: { pricingPlan: { id: planId } as any }, select: { id: true, name: true }, take: 5 });

      // Distinct orgs with overrides on this plan (may remain unchanged)
      const overridesOnPlan = await prisma.tenantPriceOverride.count({ where: { planId } });

      return NextResponse.json({ ok: true, impact: { tenantsAffected, sampleTenants, overridesOnPlan } });
    }

    if (scope.type === 'tenant') {
      const orgId = scope.orgId || '';
      if (!orgId) return NextResponse.json({ ok: false, error: 'missing_orgId' }, { status: 400 });
      const exists = await prisma.org.findUnique({ where: { id: orgId }, select: { id: true, name: true } });
      if (!exists) return NextResponse.json({ ok: false, error: 'unknown_org' }, { status: 404 });
      return NextResponse.json({ ok: true, impact: { tenantsAffected: 1, sampleTenants: [exists] } });
    }

    return NextResponse.json({ ok: false, error: 'unsupported_scope' }, { status: 400 });
  } catch (error: any) {
    console.error('[simulate] error', error);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}


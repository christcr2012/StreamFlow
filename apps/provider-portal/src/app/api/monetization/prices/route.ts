import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProviderAuth, type ProviderSession } from '@/lib/api/withProviderAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';

export const dynamic = 'force-dynamic';

// Type for route context (fixes Next.js 15 type generation)
type RouteContext = { params?: Record<string, never> };

/**
 * GET /api/monetization/prices
 * List all plan prices (optionally filtered by planId)
 */
export const GET = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const url = new URL(request.url);
      const planId = url.searchParams.get('planId') || undefined;
      const where = planId ? { planId } : {};

      const items = await prisma.planPrice.findMany({
        where,
        select: {
          id: true,
          planId: true,
          currency: true,
          unitAmountCents: true,
          cadence: true,
          trialDays: true,
          active: true,
          stripePriceId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ planId: 'asc' }, { cadence: 'asc' }, { unitAmountCents: 'asc' }],
      });

      return NextResponse.json({ items });
    } catch (error) {
      console.error('Error fetching plan prices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plan prices' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_READ }
);

/**
 * POST /api/monetization/prices
 * Create a new plan price (admin only)
 */
export const POST = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json().catch(() => ({}));
      const { planId, unitAmountCents, cadence, currency, trialDays, active, stripePriceId } = body || {};

      if (!planId || typeof unitAmountCents !== 'number' || !(cadence === 'MONTHLY' || cadence === 'YEARLY')) {
        return NextResponse.json(
          { error: 'planId, unitAmountCents, and valid cadence are required' },
          { status: 400 }
        );
      }

      const item = await prisma.planPrice.create({
        data: {
          planId,
          unitAmountCents,
          cadence,
          currency: currency || 'usd',
          trialDays: trialDays ?? 0,
          active: active ?? true,
          stripePriceId: stripePriceId || null,
        },
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'plan_price_created',
          entityType: 'plan_price',
          entityId: item.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            planId,
            unitAmountCents,
            cadence,
            currency: currency || 'usd',
          },
        },
      });

      return NextResponse.json({ ok: true, item }, { status: 201 });
    } catch (error) {
      console.error('Error creating plan price:', error);
      return NextResponse.json(
        { error: 'Failed to create plan price' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_PRICES_MANAGE }
);

/**
 * PATCH /api/monetization/prices
 * Update a plan price (admin only)
 */
export const PATCH = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json().catch(() => ({}));
      const { id, unitAmountCents, cadence, currency, trialDays, active, stripePriceId } = body || {};

      if (!id) {
        return NextResponse.json(
          { error: 'id is required' },
          { status: 400 }
        );
      }

      const item = await prisma.planPrice.update({
        where: { id },
        data: { unitAmountCents, cadence, currency, trialDays, active, stripePriceId },
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'plan_price_updated',
          entityType: 'plan_price',
          entityId: item.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            changes: { unitAmountCents, cadence, currency, trialDays, active, stripePriceId },
          },
        },
      });

      return NextResponse.json({ ok: true, item });
    } catch (error) {
      console.error('Error updating plan price:', error);
      return NextResponse.json(
        { error: 'Failed to update plan price' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_PRICES_MANAGE }
);


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProviderAuth, type ProviderSession } from '@/lib/api/withProviderAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';

export const dynamic = 'force-dynamic';

// Type for route context (fixes Next.js 15 type generation)
type RouteContext = { params?: Record<string, never> };

/**
 * GET /api/monetization/plans
 * List all price plans with their prices
 */
export const GET = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const items = await prisma.pricePlan.findMany({
        include: { prices: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ items });
    } catch (error) {
      console.error('Error fetching price plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch price plans' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_READ }
);

/**
 * POST /api/monetization/plans
 * Create a new price plan (admin only)
 */
export const POST = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json().catch(() => ({}));
      const { key, name, description, prices } = body || {};

      if (!key || !name) {
        return NextResponse.json(
          { error: 'key and name are required' },
          { status: 400 }
        );
      }

      const created = await prisma.pricePlan.create({
        data: { key, name, description: description || null },
      });

      // Create associated prices if provided
      if (Array.isArray(prices)) {
        for (const p of prices) {
          if (typeof p?.unitAmountCents === 'number' && (p.cadence === 'MONTHLY' || p.cadence === 'YEARLY')) {
            await prisma.planPrice.create({
              data: {
                planId: created.id,
                unitAmountCents: p.unitAmountCents,
                currency: p.currency || 'usd',
                cadence: p.cadence,
                trialDays: p.trialDays ?? 0,
                active: p.active ?? true,
                stripePriceId: p.stripePriceId || null,
              },
            });
          }
        }
      }

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'price_plan_created',
          entityType: 'price_plan',
          entityId: created.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            key: created.key,
            name: created.name,
            pricesCount: prices?.length || 0,
          },
        },
      });

      const full = await prisma.pricePlan.findUnique({
        where: { id: created.id },
        include: { prices: true },
      });

      return NextResponse.json({ ok: true, item: full }, { status: 201 });
    } catch (error) {
      console.error('Error creating price plan:', error);
      return NextResponse.json(
        { error: 'Failed to create price plan' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_PLANS_MANAGE }
);

/**
 * PATCH /api/monetization/plans
 * Update a price plan (admin only)
 */
export const PATCH = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json().catch(() => ({}));
      const { id, name, description, active } = body || {};

      if (!id) {
        return NextResponse.json(
          { error: 'id is required' },
          { status: 400 }
        );
      }

      const updated = await prisma.pricePlan.update({
        where: { id },
        data: { name, description, active },
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'price_plan_updated',
          entityType: 'price_plan',
          entityId: updated.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            changes: { name, description, active },
          },
        },
      });

      return NextResponse.json({ ok: true, item: updated });
    } catch (error) {
      console.error('Error updating price plan:', error);
      return NextResponse.json(
        { error: 'Failed to update price plan' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_PLANS_MANAGE }
);


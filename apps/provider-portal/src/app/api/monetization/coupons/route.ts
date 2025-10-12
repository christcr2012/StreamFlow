import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withProviderAuth, type ProviderSession } from '@/lib/api/withProviderAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';

export const dynamic = 'force-dynamic';

// Type for route context (fixes Next.js 15 type generation)
type RouteContext = { params?: Record<string, never> };

/**
 * GET /api/monetization/coupons
 * List coupons with optional filtering
 */
export const GET = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const url = new URL(request.url);
      const code = url.searchParams.get('code') || undefined;
      const active = url.searchParams.get('active');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
      const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

      const where: any = {};
      if (code) where.code = code;
      if (active === 'true') where.active = true;
      if (active === 'false') where.active = false;

      const [items, total] = await Promise.all([
        prisma.coupon.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
        prisma.coupon.count({ where }),
      ]);

      return NextResponse.json({ items, page: { total, limit, offset } });
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch coupons' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_READ }
);

/**
 * POST /api/monetization/coupons
 * Create a new coupon (admin only)
 */
export const POST = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json().catch(() => ({}));
      const item = await prisma.coupon.create({ data: body });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'coupon_created',
          entityType: 'coupon',
          entityId: item.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            code: item.code,
          },
        },
      });

      return NextResponse.json({ ok: true, item }, { status: 201 });
    } catch (error) {
      console.error('Error creating coupon:', error);
      return NextResponse.json(
        { error: 'Failed to create coupon' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_COUPONS_MANAGE }
);

/**
 * PATCH /api/monetization/coupons
 * Update a coupon (admin only)
 */
export const PATCH = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json().catch(() => ({}));
      const { id, ...rest } = body || {};

      if (!id) {
        return NextResponse.json(
          { error: 'id is required' },
          { status: 400 }
        );
      }

      const item = await prisma.coupon.update({ where: { id }, data: rest });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'coupon_updated',
          entityType: 'coupon',
          entityId: item.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            changes: rest,
          },
        },
      });

      return NextResponse.json({ ok: true, item });
    } catch (error) {
      console.error('Error updating coupon:', error);
      return NextResponse.json(
        { error: 'Failed to update coupon' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_COUPONS_MANAGE }
);

/**
 * DELETE /api/monetization/coupons
 * Delete a coupon (admin only)
 */
export const DELETE = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: 'id is required' },
          { status: 400 }
        );
      }

      await prisma.coupon.delete({ where: { id } });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'coupon_deleted',
          entityType: 'coupon',
          entityId: id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {},
        },
      });

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return NextResponse.json(
        { error: 'Failed to delete coupon' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.MONETIZATION_COUPONS_MANAGE }
);


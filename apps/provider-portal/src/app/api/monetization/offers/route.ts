import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compose, withProviderAuth, withRateLimit } from '@/lib/api/middleware';
import { withAudit } from '@/lib/api/audit-middleware';

export const dynamic = 'force-dynamic';

const getHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const active = url.searchParams.get('active');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
  const where: any = {};
  if (active === 'true') where.active = true;
  if (active === 'false') where.active = false;
  const [items, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      select: {
        id: true,
        name: true,
        percentOff: true,
        amountOffCents: true,
        duration: true,
        durationMonths: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.offer.count({ where }),
  ]);
  return NextResponse.json({ items, page: { total, limit, offset } });
};

const postHandler = async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const item = await prisma.offer.create({ data: body });
  return NextResponse.json({ ok: true, item }, { status: 201 });
};

const patchHandler = async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { id, ...rest } = body || {};
  if (!id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 });
  const item = await prisma.offer.update({ where: { id }, data: rest });
  return NextResponse.json({ ok: true, item });
};

const deleteHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'missing_id' }, { status: 400 });
  await prisma.offer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
};

export const GET = compose(withProviderAuth(), withRateLimit('api'))(getHandler);

export const POST = compose(withProviderAuth(), withRateLimit('api'))(
  withAudit(postHandler, {
    action: 'create',
    entityType: 'offer',
    actorType: 'provider',
    redactFields: [],
  })
);

export const PATCH = compose(withProviderAuth(), withRateLimit('api'))(
  withAudit(patchHandler, {
    action: 'update',
    entityType: 'offer',
    actorType: 'provider',
    redactFields: [],
  })
);

export const DELETE = compose(withProviderAuth(), withRateLimit('api'))(
  withAudit(deleteHandler, {
    action: 'delete',
    entityType: 'offer',
    actorType: 'provider',
    redactFields: [],
  })
);


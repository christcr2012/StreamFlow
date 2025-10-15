// Provider Usage Service
// Server-only service for usage metering, rating, and billable totals

import { prisma } from '@/lib/prisma';

export type UsageSummary = {
  totalMeters: number;
  totalQuantity: number;
  uniqueOrgs: number;
  topMeters: Array<{ meter: string; quantity: number }>;
};

export type UsageMeterItem = {
  id: string;
  orgId: string;
  orgName: string;
  meter: string;
  quantity: number;
  windowStart: string;
  windowEnd: string;
  createdAt: string;
};

export type MeterRatingSummary = {
  meter: string;
  totalQuantity: number;
  orgCount: number;
  avgQuantity: number;
};

/**
 * Get usage summary across all meters
 */
export async function getUsageSummary(): Promise<UsageSummary> {
  const [totalMeters, meters, uniqueOrgs] = await Promise.all([
    prisma.usageMeter.count(),
    prisma.usageMeter.groupBy({
      by: ['meter'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.usageMeter.findMany({
      select: { orgId: true },
      distinct: ['orgId'],
    }),
  ]);

  const totalQuantity = meters.reduce((sum: any, m: any) => sum + (m._sum.quantity || 0), 0);

  return {
    totalMeters,
    totalQuantity,
    uniqueOrgs: uniqueOrgs.length,
    topMeters: meters.map((m: any) => ({
      meter: m.meter,
      quantity: m._sum.quantity || 0,
    })),
  };
}

/**
 * List usage meters with pagination and filtering
 */
export async function listUsageMeters(params: {
  cursor?: string;
  limit?: number;
  meter?: string;
  orgId?: string;
  windowStart?: Date;
  windowEnd?: Date;
}): Promise<{ items: UsageMeterItem[]; nextCursor: string | null }> {
  const { cursor, limit = 20, meter, orgId, windowStart, windowEnd } = params;

  const where: any = {};
  if (meter) where.meter = meter;
  if (orgId) where.orgId = orgId;
  if (windowStart || windowEnd) {
    where.windowStart = {};
    if (windowStart) where.windowStart.gte = windowStart;
    if (windowEnd) where.windowStart.lte = windowEnd;
  }

  const meters = await prisma.usageMeter.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = meters.length > limit;
  const items = hasMore ? meters.slice(0, limit) : meters;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items: items.map((m: any) => ({
      id: m.id,
      orgId: m.orgId,
      orgName: m.org.name,
      meter: m.meter,
      quantity: m.quantity,
      windowStart: m.windowStart.toISOString(),
      windowEnd: m.windowEnd.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
    nextCursor,
  };
}

/**
 * Get rating summary by meter type
 */
export async function getMeterRatingSummary(): Promise<MeterRatingSummary[]> {
  const summary = await prisma.usageMeter.groupBy({
    by: ['meter'],
    _sum: { quantity: true },
    _count: { orgId: true },
    _avg: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
  });

  return summary.map((s: any) => ({
    meter: s.meter,
    totalQuantity: s._sum.quantity || 0,
    orgCount: s._count.orgId,
    avgQuantity: Math.round((s._avg.quantity || 0) * 100) / 100,
  }));
}

/**
 * Get billable totals for a specific window
 */
export async function getBillableTotals(params: {
  windowStart: Date;
  windowEnd: Date;
  orgId?: string;
}): Promise<Array<{ orgId: string; orgName: string; meter: string; quantity: number; estimatedCents: number }>> {
  const { windowStart, windowEnd, orgId } = params;

  const where: any = {
    windowStart: { gte: windowStart },
    windowEnd: { lte: windowEnd },
  };
  if (orgId) where.orgId = orgId;

  const meters = await prisma.usageMeter.findMany({
    where,
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  // Group by org and meter
  const grouped = meters.reduce((acc: any, m: any) => {
    const key = `${m.orgId}:${m.meter}`;
    if (!acc[key]) {
      acc[key] = {
        orgId: m.orgId,
        orgName: m.org.name,
        meter: m.meter,
        quantity: 0,
      };
    }
    acc[key].quantity += m.quantity;
    return acc;
  }, {} as Record<string, { orgId: string; orgName: string; meter: string; quantity: number }>);

  // Apply simple rating (TODO: Replace with actual pricing rules)
  const RATE_PER_UNIT = 10; // 10 cents per unit (example)

  return Object.values(grouped).map((item: any) => ({
    ...item,
    estimatedCents: item.quantity * RATE_PER_UNIT,
  }));
}

/**
 * Get usage trend for a specific meter
 */
export async function getUsageTrend(params: {
  meter: string;
  orgId?: string;
  days?: number;
}): Promise<Array<{ date: string; quantity: number }>> {
  const { meter, orgId, days = 30 } = params;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where: any = {
    meter,
    windowStart: { gte: startDate },
  };
  if (orgId) where.orgId = orgId;

  const meters = await prisma.usageMeter.findMany({
    where,
    orderBy: { windowStart: 'asc' },
  });

  // Group by date
  const grouped = meters.reduce((acc: any, m: any) => {
    const date = m.windowStart.toISOString().split('T')[0];
    if (!acc[date]) acc[date] = 0;
    acc[date] += m.quantity;
    return acc;
  }, {} as Record<string, number>);

  return (Object.entries(grouped) as [string, number][]).map(([date, quantity]) => ({
    date,
    quantity,
  }));
}


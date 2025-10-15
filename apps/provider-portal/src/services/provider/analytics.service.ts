// Provider Analytics Service
// Server-only service for trends, funnels, cohorts, and revenue mix

import { prisma } from '@/lib/prisma';

export type AnalyticsSummary = {
  totalOrgs: number;
  activeOrgs: number;
  totalUsers: number;
  totalRevenueCents: number;
  growthRate: number;
};

export type TrendData = {
  date: string;
  value: number;
  label: string;
};

export type FunnelStage = {
  stage: string;
  count: number;
  conversionRate: number;
};

export type CohortData = {
  cohort: string;
  size: number;
  retentionRate: number;
  revenueCents: number;
};

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalOrgs, totalUsers, activeUsers, payments] = await Promise.all([
    prisma.org.count(),
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastSuccessfulLogin: {
          gte: thirtyDaysAgo,
        },
      },
    }),
    prisma.payment.findMany({
      select: { amount: true },
    }),
  ]);

  const totalRevenueCents = payments.reduce((sum: any, p: any) =>
    sum + Math.round(parseFloat(p.amount.toString()) * 100), 0
  );

  // Active orgs = orgs with active users
  const activeOrgs = activeUsers > 0 ? Math.ceil(activeUsers / 3) : 0; // Estimate

  // Calculate growth rate (placeholder - would need historical data)
  const growthRate = 5.2; // 5.2% placeholder

  return {
    totalOrgs,
    activeOrgs,
    totalUsers,
    totalRevenueCents,
    growthRate,
  };
}

/**
 * Get revenue trend over time
 */
export async function getRevenueTrend(days: number = 30): Promise<TrendData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const payments = await prisma.payment.findMany({
    where: {
      receivedAt: { gte: startDate },
    },
    select: {
      receivedAt: true,
      amount: true,
    },
    orderBy: { receivedAt: 'asc' },
  });

  // Group by date
  const grouped = payments.reduce((acc: any, p: any) => {
    const date = p.receivedAt.toISOString().split('T')[0];
    if (!acc[date]) acc[date] = 0;
    const amountCents = Math.round(parseFloat(p.amount.toString()) * 100);
    acc[date] += amountCents;
    return acc;
  }, {} as Record<string, number>);

  return (Object.entries(grouped) as [string, number][]).map(([date, value]) => ({
    date,
    value: value / 100, // Convert to dollars
    label: `$${(value / 100).toFixed(2)}`,
  }));
}

/**
 * Get user growth trend
 */
export async function getUserGrowthTrend(days: number = 30): Promise<TrendData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date and calculate cumulative
  const grouped = users.reduce((acc: any, u: any) => {
    const date = u.createdAt.toISOString().split('T')[0];
    if (!acc[date]) acc[date] = 0;
    acc[date] += 1;
    return acc;
  }, {} as Record<string, number>);

  let cumulative = 0;
  return (Object.entries(grouped) as [string, number][])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => {
      cumulative += value;
      return {
        date,
        value: cumulative,
        label: `${cumulative} users`,
      };
    });
}

/**
 * Get lead conversion funnel
 */
export async function getLeadFunnel(): Promise<FunnelStage[]> {
  const [total, newLeads, converted] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.lead.count({ where: { status: 'CONVERTED' } }),
  ]);

  return [
    {
      stage: 'Total Leads',
      count: total,
      conversionRate: 100,
    },
    {
      stage: 'New',
      count: newLeads,
      conversionRate: total > 0 ? Math.round((newLeads / total) * 10000) / 100 : 0,
    },
    {
      stage: 'Converted',
      count: converted,
      conversionRate: total > 0 ? Math.round((converted / total) * 10000) / 100 : 0,
    },
  ];
}

/**
 * Get cohort analysis by signup month
 */
export async function getCohortAnalysis(): Promise<CohortData[]> {
  const orgs = await prisma.org.findMany({
    select: {
      id: true,
      createdAt: true,
    },
  });

  // Group by month
  const cohorts = new Map<string, {
    size: number;
    activeCount: number;
    revenueCents: number;
    orgIds: string[];
  }>();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (const org of orgs) {
    const cohort = org.createdAt.toISOString().substring(0, 7); // YYYY-MM
    const existing = cohorts.get(cohort) || { size: 0, activeCount: 0, revenueCents: 0, orgIds: [] };

    existing.size += 1;
    existing.orgIds.push(org.id);

    cohorts.set(cohort, existing);
  }

  // Get active users and payments for each cohort
  for (const [cohort, data] of cohorts.entries()) {
    const activeUsers = await prisma.user.count({
      where: {
        orgId: { in: data.orgIds },
        lastSuccessfulLogin: { gte: thirtyDaysAgo },
      },
    });

    const payments = await prisma.payment.findMany({
      where: { orgId: { in: data.orgIds } },
      select: { amount: true },
    });

    data.activeCount = activeUsers > 0 ? data.orgIds.length : 0; // Simplified
    data.revenueCents = payments.reduce((sum: any, p: any) =>
      sum + Math.round(parseFloat(p.amount.toString()) * 100), 0
    );
  }

  return Array.from(cohorts.entries())
    .map(([cohort, data]) => ({
      cohort,
      size: data.size,
      retentionRate: data.size > 0
        ? Math.round((data.activeCount / data.size) * 10000) / 100
        : 0,
      revenueCents: data.revenueCents,
    }))
    .sort((a, b) => b.cohort.localeCompare(a.cohort));
}

/**
 * Get revenue mix by stream
 */
export async function getRevenueMix(): Promise<Array<{
  stream: string;
  revenueCents: number;
  percentage: number;
}>> {
  const payments = await prisma.payment.findMany({
    select: { amount: true, method: true },
  });

  const streamRevenue = new Map<string, number>();
  let totalRevenueCents = 0;

  for (const payment of payments) {
    const amountCents = Math.round(parseFloat(payment.amount.toString()) * 100);
    const stream = payment.method; // Use payment method as stream
    const current = streamRevenue.get(stream) || 0;
    streamRevenue.set(stream, current + amountCents);
    totalRevenueCents += amountCents;
  }

  return Array.from(streamRevenue.entries())
    .map(([stream, revenueCents]) => ({
      stream,
      revenueCents,
      percentage: totalRevenueCents > 0
        ? Math.round((revenueCents / totalRevenueCents) * 10000) / 100
        : 0,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

/**
 * Get top performing organizations
 */
export async function getTopOrgs(limit: number = 10): Promise<Array<{
  orgId: string;
  orgName: string;
  userCount: number;
  revenueCents: number;
  lastActivityAt: string;
}>> {
  const orgs = await prisma.org.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const orgData = await Promise.all(orgs.map(async (org) => {
    const [userCount, payments, lastUser] = await Promise.all([
      prisma.user.count({ where: { orgId: org.id } }),
      prisma.payment.findMany({
        where: { orgId: org.id },
        select: { amount: true },
      }),
      prisma.user.findFirst({
        where: { orgId: org.id, lastSuccessfulLogin: { not: null } },
        orderBy: { lastSuccessfulLogin: 'desc' },
        select: { lastSuccessfulLogin: true },
      }),
    ]);

    const revenueCents = payments.reduce((sum: any, p: any) =>
      sum + Math.round(parseFloat(p.amount.toString()) * 100), 0
    );

    return {
      orgId: org.id,
      orgName: org.name,
      userCount,
      revenueCents,
      lastActivityAt: lastUser?.lastSuccessfulLogin?.toISOString() || new Date().toISOString(),
    };
  }));

  return orgData
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
}


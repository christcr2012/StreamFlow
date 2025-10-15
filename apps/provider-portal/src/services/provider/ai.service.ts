import { prisma } from '@/lib/prisma';

export interface AiOverview {
  monthKey: string;
  totals: {
    creditsUsed: number;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    callCount: number;
  };
  topOrgs: Array<{ orgId: string; orgName: string; creditsUsed: number; tokensIn: number; tokensOut: number; costUsd: number }>;
  recent: Array<{ id: string; orgId: string; orgName: string; feature: string; model: string; creditsUsed: number; createdAt: Date }>;
}

export async function getAiOverview(): Promise<AiOverview> {
  const monthKey = new Date().toISOString().slice(0, 7);

  try {
    // Aggregate totals across all orgs for current month
    const totalsAgg = await prisma.aiMonthlySummary.aggregate({
      _sum: { creditsUsed: true, tokensIn: true, tokensOut: true, costUsd: true, callCount: true },
      where: { monthKey },
    });

    // Top orgs by credits used
    const top = await prisma.aiMonthlySummary.findMany({
      where: { monthKey },
      orderBy: { creditsUsed: 'desc' },
      take: 10,
      include: { org: { select: { id: true, name: true } } },
    });

    // Recent events across all orgs
    const recentEvents = await prisma.aiUsageEvent.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { org: { select: { id: true, name: true } } },
    });

    return {
      monthKey,
      totals: {
        creditsUsed: totalsAgg._sum.creditsUsed || 0,
        tokensIn: totalsAgg._sum.tokensIn || 0,
        tokensOut: totalsAgg._sum.tokensOut || 0,
        costUsd: Number(totalsAgg._sum.costUsd || 0),
        callCount: totalsAgg._sum.callCount || 0,
      },
      topOrgs: top.map((t: any) => ({
        orgId: t.orgId,
        orgName: t.org?.name || t.orgId,
        creditsUsed: t.creditsUsed,
        tokensIn: t.tokensIn,
        tokensOut: t.tokensOut,
        costUsd: Number(t.costUsd),
      })),
      recent: recentEvents.map((e: any) => ({
        id: e.id,
        orgId: e.orgId,
        orgName: (e as any).org?.name || e.orgId,
        feature: e.feature,
        model: e.model,
        creditsUsed: e.creditsUsed,
        createdAt: e.createdAt,
      })),
    };
  } catch (error) {
    console.error('Error in getAiOverview:', error);
    // Return empty data on error
    return {
      monthKey,
      totals: { creditsUsed: 0, tokensIn: 0, tokensOut: 0, costUsd: 0, callCount: 0 },
      topOrgs: [],
      recent: [],
    };
  }
}


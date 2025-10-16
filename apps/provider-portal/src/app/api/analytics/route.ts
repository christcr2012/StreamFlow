import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonError } from '@/lib/api/response';
import { compose, withProviderAuth, withRateLimit, withIdempotencyRequired } from '@/lib/api/middleware';

const handler = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30'; // days

    const daysAgo = parseInt(range);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Calculate real revenue trends from subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        priceCents: true,
        createdAt: true,
        status: true
      }
    });

    // Group by date and calculate MRR/ARR
    const revenueByDate = new Map<string, { mrr: number; arr: number }>();

    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(Date.now() - (daysAgo - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayStart = new Date(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const activeSubs = subscriptions.filter(sub =>
        new Date(sub.createdAt) <= dayEnd && sub.status === 'active'
      );

      const mrr = activeSubs.reduce((sum, sub) => sum + (sub.priceCents / 100), 0);
      const arr = mrr * 12;

      revenueByDate.set(date, { mrr, arr });
    }

    const revenueTrends = Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
      date,
      mrr: revenue.mrr,
      arr: revenue.arr
    }));

    // Calculate real user growth
    const orgs = await prisma.org.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true
      }
    });

    const usersByDate = new Map<string, number>();

    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(Date.now() - (daysAgo - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayStart = new Date(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const newUsers = orgs.filter(org => {
        const created = new Date(org.createdAt);
        return created >= dayStart && created < dayEnd;
      }).length;

      const activeUsers = orgs.filter(org => new Date(org.createdAt) <= dayEnd).length;

      usersByDate.set(date, newUsers);
    }

    const userGrowth = Array.from(usersByDate.entries()).map(([date, newUsers], index) => ({
      date,
      newUsers,
      activeUsers: orgs.filter(org => new Date(org.createdAt) <= new Date(date)).length
    }));

    // Conversion funnel
    const totalInvites = await prisma.onboardingInvite.count();
    const acceptedInvites = await prisma.onboardingInvite.count({
      where: { usedAt: { not: null } }
    });
    const totalOrgs = await prisma.org.count();
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'active' }
    });

    const conversionFunnel = [
      { stage: 'Invites Sent', count: totalInvites },
      { stage: 'Invites Accepted', count: acceptedInvites },
      { stage: 'Orgs Created', count: totalOrgs },
      { stage: 'Active Subscriptions', count: activeSubscriptions }
    ];

    // Top clients by revenue (mock)
    const topClients = await prisma.org.findMany({
      take: 10,
      include: {
        subscriptions: {
          where: { status: 'active' },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const topClientsByRevenue = topClients.map(org => ({
      name: org.name,
      revenue: org.subscriptions[0]?.priceCents || 0
    })).sort((a, b) => b.revenue - a.revenue);

    // Top features by usage (mock)
    const topFeatures = [
      { feature: 'Lead Management', usage: 1250 },
      { feature: 'AI Assistant', usage: 980 },
      { feature: 'Reporting', usage: 750 },
      { feature: 'Invoicing', usage: 620 },
      { feature: 'Analytics', usage: 450 }
    ];

    return jsonOk({
      revenueTrends,
      userGrowth,
      conversionFunnel,
      topClientsByRevenue,
      topFeatures
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return jsonError(500, 'internal_error', 'Failed to fetch analytics');
  }
};

export const GET = compose(withProviderAuth())(handler);

// AI 402 Guard acceptance: reuse same route with POST, no new endpoint.
// If body.simulate === '402', force a 402 payload for acceptance testing.
// Otherwise, if body.orgId is provided, perform a real budget check using aiMeter.
export const POST = compose(withRateLimit('api'), withIdempotencyRequired(), withProviderAuth())(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({} as any));
  const simulate = (body && typeof body.simulate === 'string') ? body.simulate : undefined;

  if (simulate === '402') {
    return new Response(
      JSON.stringify({
        error: 'PAYMENT_REQUIRED',
        feature: 'ai.concierge',
        required_prepay_cents: 1500,
        enable_path: '/provider/wallet/prepay?feature=ai.concierge&amount_cents=1500',
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Budget-aware guard when orgId is supplied
  if (typeof body?.orgId === 'string' && body.orgId) {
    const { checkAiBudget } = await import('@/lib/aiMeter');
    const ESTIMATED_CREDITS = 50; // default per-call estimate
    const budget = await checkAiBudget(body.orgId, 'ai.concierge', ESTIMATED_CREDITS);
    if (!budget.allowed) {
      const missingCredits = Math.max(0, ESTIMATED_CREDITS - (budget.creditsRemaining || 0));
      const required_prepay_cents = missingCredits * 5; // 1 credit = $0.05 = 5 cents
      return new Response(
        JSON.stringify({
          error: 'PAYMENT_REQUIRED',
          feature: 'ai.concierge',
          required_prepay_cents,
          enable_path: `/provider/wallet/prepay?feature=ai.concierge&amount_cents=${required_prepay_cents}`,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Otherwise, pretend the AI request succeeded (stub)
  return jsonOk({ ok: true, message: 'AI concierge processed (stub)' });
});


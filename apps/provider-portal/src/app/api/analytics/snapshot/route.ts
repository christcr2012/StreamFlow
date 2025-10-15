import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api/response';
import { compose, withProviderAuth } from '@/lib/api/middleware';
import { prisma } from '@/lib/prisma';

/**
 * Analytics Snapshot Cron Job
 *
 * This endpoint should be called daily (via Vercel Cron or external scheduler)
 * to generate analytics snapshots for caching and reporting.
 *
 * Vercel Cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/provider/analytics/snapshot",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

const postHandler = async (req: NextRequest) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if snapshot already exists for today
    const existing = await prisma.analyticsSnapshot.findUnique({
      where: { snapshotDate: today },
    });

    if (existing) {
      return jsonOk({ snapshot: existing, message: 'Snapshot already exists for today' });
    }

    // Calculate MRR/ARR from active subscriptions
    // Note: priceCents is monthly price, so MRR is sum of all active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
      },
      select: {
        priceCents: true,
        meta: true,
      },
    });

    let mrrCents = 0;
    subscriptions.forEach((sub: any) => {
      // priceCents is already monthly, so just sum
      mrrCents += sub.priceCents;
    });

    const arrCents = mrrCents * 12;

    // Count active clients (orgs with active subscriptions)
    const activeClients = await prisma.org.count({
      where: {
        subscriptions: {
          some: {
            status: 'active',
          },
        },
      },
    });

    // Count new clients (created today)
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const newClients = await prisma.org.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Count churned clients (subscriptions cancelled today)
    const churnedClients = await prisma.subscription.count({
      where: {
        status: 'canceled',
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Calculate total revenue (sum of all completed payments from Activity)
    const payments = await prisma.activity.findMany({
      where: {
        action: 'paid',
        entityType: 'invoice',
      },
      select: {
        meta: true,
      },
    });

    let totalRevenue = 0;
    payments.forEach((payment: any) => {
      const amount = (payment.meta as any)?.amount || 0;
      totalRevenue += amount;
    });

    // Create snapshot
    const snapshot = await prisma.analyticsSnapshot.create({
      data: {
        snapshotDate: today,
        mrrCents,
        arrCents,
        activeClients,
        newClients,
        churnedClients,
        totalRevenue,
        metricsJson: {
          subscriptionCount: subscriptions.length,
          avgRevenuePerClient: activeClients > 0 ? Math.round(mrrCents / activeClients) : 0,
        },
      },
    });

    return jsonOk({ snapshot, message: 'Snapshot created successfully' });
  } catch (error) {
    console.error('Error creating analytics snapshot:', error);
    return jsonError(500, 'internal_error', 'Failed to create analytics snapshot');
  }
};

export const POST = compose(withProviderAuth())(postHandler);
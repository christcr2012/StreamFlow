// Provider Stats API - Dashboard metrics for Provider business overview
// Referenced: javascript_stripe integration for subscription management

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { assertPermission, PERMS } from '@/lib/rbac';
import { verifyFederation, federationOverridesRBAC } from '@/lib/providerFederationVerify';
import { envLog } from '@/lib/environment';

const prisma = new PrismaClient();

/**
 * Provider Stats API
 *
 * GET /api/provider/stats?period=30d
 * - Returns comprehensive provider business metrics
 * - Supports date range filtering: 30d, 90d, all
 * - Includes revenue, costs, profit margins, client counts
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Federation check - allows Provider Portal to bypass RBAC
    const fed = await verifyFederation(req);

    // Require provider permissions unless federation override
    if (!federationOverridesRBAC(fed)) {
      if (!(await assertPermission(req, res, PERMS.PROVIDER_BILLING))) {
        return; // assertPermission already sent response
      }
    }

    // Parse period parameter
    const { period = '30d' } = req.query;
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get current month key
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get all organizations count
    const totalClients = await prisma.org.count();

    // Get active subscriptions count
    const activeSubscriptions = await prisma.org.count({
      where: {
        subscriptionStatus: 'active'
      }
    });

    // Get new clients in period
    const newClients = await prisma.org.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    // Calculate Monthly Recurring Revenue (MRR)
    const subscriptionRevenue = await prisma.org.groupBy({
      by: ['aiPlan'],
      where: {
        subscriptionStatus: 'active'
      },
      _count: {
        id: true
      }
    });

    const planPricing = {
      'BASE': 0,    // Free tier
      'PRO': 97,    // $97/month
      'ELITE': 297  // $297/month
    } as const;

    const monthlyRecurringRevenue = subscriptionRevenue.reduce((total, group) => {
      const planPrice = planPricing[group.aiPlan as keyof typeof planPricing] || 0;
      return total + (planPrice * group._count.id);
    }, 0);

    // Calculate conversion revenue (period-based)
    const conversionRevenueResult = await prisma.leadInvoice.aggregate({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        totalCents: true
      }
    });
    const conversionRevenue = (conversionRevenueResult._sum.totalCents || 0) / 100;

    // Calculate Provider costs (period-based AI usage)
    const providerCostsResult = await prisma.aiUsageEvent.aggregate({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        costUsd: true
      }
    });
    const totalProviderCosts = parseFloat(providerCostsResult._sum.costUsd?.toString() || '0');

    // Calculate total revenue for period
    const totalRevenue = monthlyRecurringRevenue + conversionRevenue;

    // Calculate profit margin
    const profitMargin = totalRevenue > 0
      ? Math.round(((totalRevenue - totalProviderCosts) / totalRevenue) * 100)
      : 0;

    // Get plan breakdown
    const planBreakdown = subscriptionRevenue.map(group => ({
      plan: group.aiPlan,
      count: group._count.id,
      revenue: (planPricing[group.aiPlan as keyof typeof planPricing] || 0) * group._count.id
    }));

    // Calculate churn rate (clients who cancelled in period)
    const churnedClients = await prisma.org.count({
      where: {
        subscriptionStatus: 'canceled',
        updatedAt: {
          gte: startDate
        }
      }
    });

    const churnRate = totalClients > 0
      ? Math.round((churnedClients / totalClients) * 100)
      : 0;

    const stats = {
      overview: {
        totalClients,
        activeSubscriptions,
        newClients,
        churnedClients,
        churnRate
      },
      revenue: {
        monthlyRecurringRevenue,
        conversionRevenue,
        totalRevenue,
        planBreakdown
      },
      costs: {
        totalProviderCosts,
        profitMargin
      },
      period: {
        label: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }
    };

    envLog('info', 'Provider stats retrieved', {
      period,
      totalRevenue,
      federationCall: federationOverridesRBAC(fed)
    });

    res.status(200).json({
      ok: true,
      stats
    });

  } catch (error) {
    envLog('error', 'Provider stats API error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch provider stats'
    });
  }
}
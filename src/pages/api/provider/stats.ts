// Provider Stats API - Dashboard metrics for Provider business overview
// Referenced: javascript_stripe integration for subscription management

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
// Using middleware for auth - will work with existing session system

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple auth check - Provider portal access  
    // TODO: Add proper Provider role verification
    const cookies = req.headers.cookie;
    if (!cookies?.includes('mv_user')) {
      return res.status(401).json({ error: 'Unauthorized' });
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

    // Calculate conversion revenue (all-time)
    const conversionRevenueResult = await prisma.leadInvoice.aggregate({
      _sum: {
        amountCents: true
      }
    });
    const conversionRevenue = (conversionRevenueResult._sum.amountCents || 0) / 100;

    // Calculate Provider costs (current month AI usage)
    const providerCostsResult = await prisma.aiMonthlySummary.aggregate({
      where: {
        monthKey: currentMonth
      },
      _sum: {
        costUsd: true
      }
    });
    const totalProviderCosts = parseFloat(providerCostsResult._sum.costUsd?.toString() || '0');

    // Calculate profit margin
    const totalRevenue = monthlyRecurringRevenue + conversionRevenue;
    const profitMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalProviderCosts) / totalRevenue) * 100) : 0;

    const stats = {
      totalClients,
      activeSubscriptions,
      monthlyRecurringRevenue,
      conversionRevenue,
      totalProviderCosts,
      profitMargin
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Provider stats API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch provider stats' 
    });
  }
}
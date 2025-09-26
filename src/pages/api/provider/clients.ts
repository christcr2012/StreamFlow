// Provider API - Get all client subscriptions and their status
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

    // Get all organizations for Provider dashboard
    const orgs = await prisma.org.findMany({
      select: {
        id: true,
        name: true,
        aiPlan: true,
        aiCreditBalance: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        users: {
          select: {
            email: true,
            name: true
          },
          take: 1
        },
        // Get conversion count and revenue
        leadInvoices: {
          select: {
            totalCents: true
          }
        },
        // Get monthly AI usage
        aiMonthlySummaries: {
          select: {
            creditsUsed: true,
            monthKey: true
          },
          orderBy: {
            monthKey: 'desc'
          },
          take: 1
        }
      }
    });

    const clients = orgs.map(org => {
      const primaryUser = org.users[0];
      const totalRevenue = org.leadInvoices.reduce((sum, invoice) => sum + invoice.totalCents, 0) / 100;
      const conversionCount = org.leadInvoices.length;
      const currentMonthUsage = org.aiMonthlySummaries[0]?.creditsUsed || 0;

      return {
        id: org.id,
        name: org.name || 'Unnamed Organization',
        email: primaryUser?.email || 'No email',
        plan: org.aiPlan,
        status: org.subscriptionStatus || 'free',
        creditsRemaining: org.aiCreditBalance,
        monthlyUsage: currentMonthUsage,
        conversionCount,
        revenue: totalRevenue,
        subscriptionStartDate: org.subscriptionStartDate?.toISOString().split('T')[0],
        stripeCustomerId: org.stripeCustomerId,
        stripeSubscriptionId: org.stripeSubscriptionId
      };
    });

    res.status(200).json({
      success: true,
      clients
    });

  } catch (error) {
    console.error('Provider clients API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch client data' 
    });
  }
}
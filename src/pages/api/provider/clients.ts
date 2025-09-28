// Provider API - Get all client subscriptions and their status
// Referenced: javascript_stripe integration for subscription management

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getEmailFromReq } from "@/lib/rbac";

// Ensure only providers can access this endpoint using environment-based auth
async function ensureProvider(req: NextApiRequest, res: NextApiResponse) {
  const providerEmail = process.env.PROVIDER_EMAIL;
  if (!providerEmail) {
    res.status(500).json({ ok: false, error: "Provider system not configured" });
    return null;
  }

  const email = getEmailFromReq(req);
  if (!email || email.toLowerCase() !== providerEmail.toLowerCase()) {
    res.status(403).json({ ok: false, error: "Provider access required" });
    return null;
  }

  return { id: 'provider-system', email: providerEmail };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const user = await ensureProvider(req, res);
    if (!user) return;

    // Get all organizations for Provider dashboard
    const orgs = await db.org.findMany({
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
      ok: true,
      clients
    });

  } catch (error: any) {
    console.error('Provider clients API error:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to fetch client data' 
    });
  }
}
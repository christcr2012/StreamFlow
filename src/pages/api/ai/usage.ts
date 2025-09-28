// AI Usage Monitoring API
// Provides real-time usage statistics for dashboard without exposing actual costs

import type { NextApiRequest, NextApiResponse } from "next";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { getAiUsage } from "@/lib/aiMeter";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check permissions
    const orgId = await getOrgIdFromReq(req);
    if (!orgId) {
      return res.status(401).json({ error: 'Organization not found' });
    }
    await assertPermission(req, res, PERMS.LEAD_READ);

    // Get current AI usage for organization
    const usage = await getAiUsage(orgId);

    // Get recent AI usage events (last 15 events)
    const recentEvents = await (prisma as any).aiUsageEvent.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        feature: true,
        model: true,
        tokensIn: true,
        tokensOut: true,
        creditsUsed: true,
        createdAt: true
      }
    });

    // Get feature breakdown for current month
    const monthKey = usage.monthKey;
    const featureStats = await (prisma as any).aiUsageEvent.groupBy({
      by: ['feature'],
      where: {
        orgId,
        createdAt: {
          gte: new Date(`${monthKey}-01`),
          lt: new Date(new Date(`${monthKey}-01`).setMonth(new Date(`${monthKey}-01`).getMonth() + 1))
        }
      },
      _count: { id: true },
      _sum: { 
        creditsUsed: true,
        tokensIn: true,
        tokensOut: true
      }
    });

    // Get daily usage for last 30 days (for trend chart)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyUsage = await (prisma as any).aiUsageEvent.groupBy({
      by: ['createdAt'],
      where: {
        orgId,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: { id: true },
      _sum: { creditsUsed: true }
    });

    // Process daily usage into daily buckets
    const dailyBuckets = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      
      // Find usage for this day
      const dayUsage = dailyUsage.filter((day: any) =>
        day.createdAt.toISOString().split('T')[0] === dayKey
      );

      const dayCredits = dayUsage.reduce((sum: number, usage: any) => sum + (usage._sum?.creditsUsed || 0), 0);
      const dayRequests = dayUsage.reduce((sum: number, usage: any) => sum + (usage._count?.id || 0), 0);
      
      dailyBuckets.push({
        date: dayKey,
        credits: dayCredits,
        requests: dayRequests
      });
    }

    // Get monthly request count from current summary
    const monthlySummary = await (prisma as any).aiMonthlySummary.findUnique({
      where: { 
        orgId_monthKey: { orgId, monthKey }
      },
      select: { callCount: true }
    });

    // Return comprehensive usage data without exposing actual dollar costs
    return res.status(200).json({
      success: true,
      usage: {
        creditsRemaining: usage.creditsRemaining,
        creditsUsedThisMonth: usage.creditsUsedThisMonth,
        monthlyBudgetCredits: usage.monthlyBudgetCredits,
        percentUsed: usage.percentUsed,
        plan: usage.plan,
        monthKey: usage.monthKey,
        alerts: usage.alerts,
        // Feature limits by plan
        features: getPlanFeatures(usage.plan),
        // Upgrade suggestions
        upgradeRecommendation: getUpgradeRecommendation(usage),
        // Real analytics data
        monthlyRequestCount: monthlySummary?.callCount || 0,
        recentEvents: recentEvents.map((event: any) => ({
          id: event.id,
          feature: event.feature,
          model: event.model,
          tokensIn: event.tokensIn,
          tokensOut: event.tokensOut,
          creditsUsed: event.creditsUsed,
          createdAt: event.createdAt,
          // Human-friendly relative time
          timeAgo: getTimeAgo(event.createdAt)
        })),
        featureBreakdown: featureStats.map((stat: any) => ({
          feature: stat.feature,
          requests: stat._count.id,
          creditsUsed: stat._sum.creditsUsed || 0,
          tokensIn: stat._sum.tokensIn || 0,
          tokensOut: stat._sum.tokensOut || 0
        })),
        dailyUsage: dailyBuckets
      }
    });

  } catch (error) {
    console.error('AI usage API error:', error);
    return res.status(500).json({ 
      error: 'Failed to get AI usage data',
      success: false 
    });
  }
}

/**
 * Get feature access by plan tier
 */
function getPlanFeatures(plan: string) {
  const features = {
    BASE: {
      leadAnalysis: true,
      rfpStrategy: true,
      pricingIntelligence: true,
      responseGeneration: true,
      maxCreditsPerCall: 2000,
      dailyLimit: 10000,
      advancedFeatures: false
    },
    PRO: {
      leadAnalysis: true,
      rfpStrategy: true,
      pricingIntelligence: true,
      responseGeneration: true,
      maxCreditsPerCall: 5000,
      dailyLimit: 25000,
      advancedFeatures: true,
      competitiveAnalysis: true,
      prioritySupport: true
    },
    ELITE: {
      leadAnalysis: true,
      rfpStrategy: true,
      pricingIntelligence: true,
      responseGeneration: true,
      maxCreditsPerCall: 10000,
      dailyLimit: 50000,
      advancedFeatures: true,
      competitiveAnalysis: true,
      prioritySupport: true,
      customIntegrations: true,
      dedicatedSupport: true
    }
  };

  return features[plan as keyof typeof features] || features.BASE;
}

/**
 * Suggest upgrades based on usage patterns
 */
function getUpgradeRecommendation(usage: any) {
  const { percentUsed, plan, alerts } = usage;

  if (plan === 'BASE' && percentUsed > 75) {
    return {
      suggested: 'PRO',
      reason: 'High usage detected - PRO plan offers 5x more credits and advanced features',
      benefits: ['50,000 monthly credits', 'Advanced competitive analysis', 'Priority support'],
      urgency: alerts.critical ? 'high' : 'medium'
    };
  }

  if (plan === 'PRO' && percentUsed > 85) {
    return {
      suggested: 'ELITE',
      reason: 'Power user detected - ELITE plan offers unlimited usage and premium features',
      benefits: ['100,000 monthly credits', 'Custom integrations', 'Dedicated support'],
      urgency: alerts.critical ? 'high' : 'medium'
    };
  }

  if (alerts.exhausted) {
    return {
      suggested: 'TOP_UP',
      reason: 'Monthly limit reached - add more credits to continue using AI features',
      benefits: ['Immediate credit restoration', 'No waiting for next month'],
      urgency: 'immediate'
    };
  }

  return null;
}

/**
 * Get human-friendly time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
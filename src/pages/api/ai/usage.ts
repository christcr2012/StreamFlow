// AI Usage Monitoring API
// Provides real-time usage statistics for dashboard without exposing actual costs

import type { NextApiRequest, NextApiResponse } from "next";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { getAiUsage } from "@/lib/aiMeter";

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

    // Return usage data without exposing actual dollar costs
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
        upgradeRecommendation: getUpgradeRecommendation(usage)
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
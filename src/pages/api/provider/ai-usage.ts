/**
 * 🤖 PROVIDER AI USAGE MONITORING API
 * Track AI usage across all client organizations for cost control and billing
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateProvider } from "@/lib/provider-auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate provider access
    const providerUser = await authenticateProvider(req);
    if (!providerUser) {
      return res.status(401).json({ error: 'Provider authentication required' });
    }

    const { timeframe = 'month', orgId } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Build query filters
    const whereClause: any = {
      createdAt: { gte: startDate }
    };

    if (orgId && typeof orgId === 'string') {
      whereClause.orgId = orgId;
    }

    // Get AI usage statistics
    const [usageEvents, usageByOrg, usageByFeature, totalStats] = await Promise.all([
      // Recent usage events
      prisma.aiUsageEvent.findMany({
        where: whereClause,
        include: {
          org: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),

      // Usage grouped by organization
      prisma.aiUsageEvent.groupBy({
        by: ['orgId'],
        where: whereClause,
        _sum: {
          creditsUsed: true,
          tokensIn: true,
          tokensOut: true
        },
        _count: {
          id: true
        }
      }),

      // Usage grouped by feature
      prisma.aiUsageEvent.groupBy({
        by: ['feature'],
        where: whereClause,
        _sum: {
          creditsUsed: true,
          tokensIn: true,
          tokensOut: true
        },
        _count: {
          id: true
        }
      }),

      // Total statistics
      prisma.aiUsageEvent.aggregate({
        where: whereClause,
        _sum: {
          creditsUsed: true,
          tokensIn: true,
          tokensOut: true,
          costUsd: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Get organization names for the grouped data
    const orgIds = usageByOrg.map(item => item.orgId);
    const organizations = await prisma.org.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true }
    });

    const orgMap = new Map(organizations.map(org => [org.id, org.name]));

    // Format the response
    const response = {
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      totalStats: {
        totalEvents: totalStats._count.id || 0,
        totalCreditsUsed: totalStats._sum.creditsUsed || 0,
        totalCostUsd: Number(totalStats._sum.costUsd || 0),
        totalTokensIn: totalStats._sum.tokensIn || 0,
        totalTokensOut: totalStats._sum.tokensOut || 0
      },
      usageByOrganization: usageByOrg.map(item => ({
        orgId: item.orgId,
        orgName: orgMap.get(item.orgId) || 'Unknown Organization',
        events: item._count.id,
        creditsUsed: item._sum.creditsUsed || 0,
        tokensIn: item._sum.tokensIn || 0,
        tokensOut: item._sum.tokensOut || 0,
        estimatedCostUsd: Math.round((item._sum.creditsUsed || 0) / 1000 * 100) / 100
      })).sort((a, b) => b.creditsUsed - a.creditsUsed),
      usageByFeature: usageByFeature.map(item => ({
        feature: item.feature,
        events: item._count.id,
        creditsUsed: item._sum.creditsUsed || 0,
        tokensIn: item._sum.tokensIn || 0,
        tokensOut: item._sum.tokensOut || 0,
        estimatedCostUsd: Math.round((item._sum.creditsUsed || 0) / 1000 * 100) / 100
      })).sort((a, b) => b.creditsUsed - a.creditsUsed),
      recentEvents: usageEvents.map(event => ({
        id: event.id,
        orgId: event.orgId,
        orgName: event.org?.name || 'Unknown',
        feature: event.feature,
        model: event.model,
        creditsUsed: event.creditsUsed,
        costUsd: Number(event.costUsd),
        tokensIn: event.tokensIn,
        tokensOut: event.tokensOut,
        createdAt: event.createdAt.toISOString()
      }))
    };

    // Add cost control alerts
    const alerts = [];
    
    // Check for high-usage organizations
    const highUsageOrgs = response.usageByOrganization.filter(org => org.creditsUsed > 10000);
    if (highUsageOrgs.length > 0) {
      alerts.push({
        type: 'high_usage',
        message: `${highUsageOrgs.length} organization(s) have high AI usage (>$10)`,
        organizations: highUsageOrgs.map(org => org.orgName)
      });
    }

    // Check for total cost threshold
    if (response.totalStats.totalCostUsd > 50) {
      alerts.push({
        type: 'cost_threshold',
        message: `Total AI costs exceed $50 for this ${timeframe}`,
        amount: response.totalStats.totalCostUsd
      });
    }

    return res.status(200).json({
      success: true,
      data: response,
      alerts,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Provider AI usage API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Example API calls:
 * 
 * GET /api/provider/ai-usage
 * GET /api/provider/ai-usage?timeframe=day
 * GET /api/provider/ai-usage?timeframe=week&orgId=org_123
 * 
 * Response format:
 * {
 *   "success": true,
 *   "data": {
 *     "timeframe": "month",
 *     "totalStats": {
 *       "totalEvents": 150,
 *       "totalCreditsUsed": 25000,
 *       "totalCostUsd": 25.00
 *     },
 *     "usageByOrganization": [...],
 *     "usageByFeature": [...],
 *     "recentEvents": [...]
 *   },
 *   "alerts": [...]
 * }
 */

// src/pages/api/provider/analytics.ts
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

function getDateRange(range: string) {
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case '1y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate: now };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const user = await ensureProvider(req, res);
    if (!user) return;

    const range = req.query.range as string || '90d';
    const { startDate, endDate } = getDateRange(range);

    // Overview metrics - CRITICAL: Exclude employee referrals from ALL Provider analytics
    const totalLeads = await db.lead.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        // CRITICAL: Exclude employee referrals from Provider analytics completely
        NOT: {
          OR: [
            { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
            { sourceType: 'EMPLOYEE_REFERRAL' },
            {
              enrichmentJson: {
                path: ['billing', 'employeeRewardEligible'],
                equals: true
              }
            }
          ]
        }
      }
    });

    const convertedLeads = await db.lead.count({
      where: {
        convertedAt: { 
          not: null,
          gte: startDate,
          lte: endDate
        },
        enrichmentJson: {
          path: ['billing', 'billableEligible'],
          equals: true
        },
        // CRITICAL: Exclude employee referrals from Provider analytics
        NOT: {
          OR: [
            { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
            { sourceType: 'EMPLOYEE_REFERRAL' },
            { 
              enrichmentJson: {
                path: ['billing', 'employeeRewardEligible'],
                equals: true
              }
            }
          ]
        }
      }
    });

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalRevenue = convertedLeads * 100;

    // Get client count for average calculation
    const clientCount = await db.org.count();
    const averageRevenuePerClient = clientCount > 0 ? totalRevenue / clientCount : 0;

    // Calculate growth rate (compare to previous period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    
    const previousConvertedLeads = await db.lead.count({
      where: {
        convertedAt: { 
          not: null,
          gte: previousStartDate,
          lt: startDate
        },
        enrichmentJson: {
          path: ['billing', 'billableEligible'],
          equals: true
        },
        // CRITICAL: Exclude employee referrals from Provider analytics
        NOT: {
          OR: [
            { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
            { sourceType: 'EMPLOYEE_REFERRAL' },
            {
              enrichmentJson: {
                path: ['billing', 'employeeRewardEligible'],
                equals: true
              }
            }
          ]
        }
      }
    });

    const previousRevenue = previousConvertedLeads * 100;
    const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Monthly breakdown - get last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0, 23, 59, 59);

      const monthLeads = await db.lead.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          },
          // CRITICAL: Exclude employee referrals from Provider analytics completely
          NOT: {
            OR: [
              { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
              { sourceType: 'EMPLOYEE_REFERRAL' },
              {
                enrichmentJson: {
                  path: ['billing', 'employeeRewardEligible'],
                  equals: true
                }
              }
            ]
          }
        }
      });

      const monthConversions = await db.lead.count({
        where: {
          convertedAt: {
            gte: monthStart,
            lte: monthEnd
          },
          enrichmentJson: {
            path: ['billing', 'billableEligible'],
            equals: true
          },
          // CRITICAL: Exclude employee referrals from Provider analytics
          NOT: {
            OR: [
              { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
              { sourceType: 'EMPLOYEE_REFERRAL' },
              {
                enrichmentJson: {
                  path: ['billing', 'employeeRewardEligible'],
                  equals: true
                }
              }
            ]
          }
        }
      });

      const monthRevenue = monthConversions * 100;
      // AI cost calculation with configurable limit
      // TODO: Replace with actual AI usage tracking from aiMeter system
      const estimatedAiCost = monthLeads * 0.02 + monthConversions * 0.1;
      const maxAiCostPerMonth = 50; // Default limit - should come from provider settings
      const aiCost = Math.min(estimatedAiCost, maxAiCostPerMonth);
      const profit = monthRevenue - aiCost;

      monthlyData.push({
        month: monthStart.toISOString(),
        leads: monthLeads,
        conversions: monthConversions,
        revenue: monthRevenue,
        aiCost,
        profit
      });
    }

    // Client performance - get top performing clients in the period
    const orgs = await db.org.findMany({
      select: {
        id: true,
        name: true
      }
    });

    const clientPerformance = await Promise.all(
      orgs.map(async (org) => {
        const leads = await db.lead.count({
          where: {
            orgId: org.id,
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            // CRITICAL: Exclude employee referrals from Provider analytics completely
            NOT: {
              OR: [
                { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
                { sourceType: 'EMPLOYEE_REFERRAL' },
                {
                  enrichmentJson: {
                    path: ['billing', 'employeeRewardEligible'],
                    equals: true
                  }
                }
              ]
            }
          }
        });

        const conversions = await db.lead.count({
          where: {
            orgId: org.id,
            convertedAt: {
              gte: startDate,
              lte: endDate
            },
            enrichmentJson: {
              path: ['billing', 'billableEligible'],
              equals: true
            },
            // CRITICAL: Exclude employee referrals from Provider analytics
            NOT: {
              OR: [
                { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
                { sourceType: 'EMPLOYEE_REFERRAL' },
                {
                  enrichmentJson: {
                    path: ['billing', 'employeeRewardEligible'],
                    equals: true
                  }
                }
              ]
            }
          }
        });

        const revenue = conversions * 100;
        const conversionRate = leads > 0 ? (conversions / leads) * 100 : 0;

        // Calculate growth vs previous period for this client
        const previousConversions = await db.lead.count({
          where: {
            orgId: org.id,
            convertedAt: {
              gte: previousStartDate,
              lt: startDate
            },
            enrichmentJson: {
              path: ['billing', 'billableEligible'],
              equals: true
            },
            // CRITICAL: Exclude employee referrals from Provider analytics
            NOT: {
              OR: [
                { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
                { sourceType: 'EMPLOYEE_REFERRAL' },
                {
                  enrichmentJson: {
                    path: ['billing', 'employeeRewardEligible'],
                    equals: true
                  }
                }
              ]
            }
          }
        });

        const previousClientRevenue = previousConversions * 100;
        const growth = previousClientRevenue > 0 ? ((revenue - previousClientRevenue) / previousClientRevenue) * 100 : 0;

        return {
          clientId: org.id,
          clientName: org.name,
          leads,
          conversions,
          revenue,
          conversionRate,
          growth
        };
      })
    );

    // Sort by revenue and take top performers
    clientPerformance.sort((a, b) => b.revenue - a.revenue);

    // Source breakdown - analyze lead sources (EXCLUDE employee referrals from Provider analytics)
    const allLeads = await db.lead.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        // CRITICAL: Exclude employee referrals from Provider analytics completely
        NOT: {
          OR: [
            { sourceType: 'MANUAL_EMPLOYEE_REFERRAL' },
            { sourceType: 'EMPLOYEE_REFERRAL' },
            {
              enrichmentJson: {
                path: ['billing', 'employeeRewardEligible'],
                equals: true
              }
            }
          ]
        }
      },
      select: {
        sourceType: true,
        convertedAt: true,
        enrichmentJson: true
      }
    });

    const sourceStats = new Map<string, {
      leads: number;
      conversions: number;
      revenue: number;
    }>();

    allLeads.forEach(lead => {
      const source = lead.sourceType || 'Unknown';
      if (!sourceStats.has(source)) {
        sourceStats.set(source, { leads: 0, conversions: 0, revenue: 0 });
      }

      const stats = sourceStats.get(source)!;
      stats.leads++;

      if (lead.convertedAt && lead.enrichmentJson && 
          (lead.enrichmentJson as any)?.billing?.billableEligible) {
        stats.conversions++;
        stats.revenue += 100;
      }
    });

    const sourceBreakdown = Array.from(sourceStats.entries()).map(([source, stats]) => ({
      source,
      leads: stats.leads,
      conversions: stats.conversions,
      revenue: stats.revenue,
      percentage: totalLeads > 0 ? (stats.leads / totalLeads) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

    const analyticsData = {
      overview: {
        totalLeads,
        convertedLeads,
        conversionRate,
        totalRevenue,
        averageRevenuePerClient,
        growthRate
      },
      monthly: monthlyData,
      clientPerformance: clientPerformance.slice(0, 10), // Top 10 clients
      sourceBreakdown: sourceBreakdown.slice(0, 10) // Top 10 sources
    };

    return res.status(200).json({
      ok: true,
      data: analyticsData
    });

  } catch (error: any) {
    console.error('Provider analytics error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to fetch analytics data' 
    });
  }
}
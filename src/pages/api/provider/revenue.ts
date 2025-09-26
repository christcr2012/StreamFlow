// src/pages/api/provider/revenue.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getEmailFromReq } from "@/lib/rbac";

// Ensure only providers can access this endpoint
async function ensureProvider(req: NextApiRequest, res: NextApiResponse) {
  const email = getEmailFromReq(req);
  if (!email) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return null;
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'PROVIDER') {
    res.status(403).json({ ok: false, error: "Provider access required" });
    return null;
  }

  return user;
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
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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

    const range = req.query.range as string || '30d';
    const { startDate, endDate } = getDateRange(range);

    // Get current month for monthly calculations
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Revenue summary calculations
    const totalConvertedLeads = await db.lead.count({
      where: {
        convertedAt: { not: null },
        enrichmentJson: {
          path: ['billing', 'billableEligible'],
          equals: true
        },
        // CRITICAL: Exclude employee referrals from Provider revenue
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

    const monthlyConvertedLeads = await db.lead.count({
      where: {
        convertedAt: {
          gte: monthStart,
          lte: endDate
        },
        enrichmentJson: {
          path: ['billing', 'billableEligible'],
          equals: true
        },
        // CRITICAL: Exclude employee referrals from Provider revenue
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

    const periodConvertedLeads = await db.lead.count({
      where: {
        convertedAt: {
          gte: startDate,
          lte: endDate
        },
        enrichmentJson: {
          path: ['billing', 'billableEligible'],
          equals: true
        },
        // CRITICAL: Exclude employee referrals from Provider revenue
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

    const totalRevenue = totalConvertedLeads * 100;
    const monthlyRevenue = monthlyConvertedLeads * 100;
    const pendingRevenue = 0; // Would be calculated from unpaid invoices

    // AI cost calculation with configurable limit
    // TODO: Replace with actual AI usage tracking from aiMeter system
    const totalLeads = await db.lead.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: endDate
        },
        // CRITICAL: Exclude employee referrals from Provider AI cost calculations
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

    const estimatedAiCost = totalLeads * 0.02 + monthlyConvertedLeads * 0.1;
    const maxAiCostPerMonth = 50; // Default limit - should come from provider settings
    const aiCosts = Math.min(estimatedAiCost, maxAiCostPerMonth);
    const netProfit = monthlyRevenue - aiCosts;
    const profitMargin = monthlyRevenue > 0 ? netProfit / monthlyRevenue : 0;
    const averageRevenuePerLead = periodConvertedLeads > 0 ? (periodConvertedLeads * 100) / periodConvertedLeads : 100;

    // Project monthly revenue based on current trends
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysSoFar = now.getDate();
    const projectedMonthlyRevenue = daysSoFar > 0 ? (monthlyRevenue / daysSoFar) * daysInMonth : monthlyRevenue;

    // Monthly breakdown - get last 6 months
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0, 23, 59, 59);

      const leads = await db.lead.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          },
          // CRITICAL: Exclude employee referrals from Provider revenue calculations
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
          convertedAt: {
            gte: monthStart,
            lte: monthEnd
          },
          enrichmentJson: {
            path: ['billing', 'billableEligible'],
            equals: true
          },
          // CRITICAL: Exclude employee referrals from Provider revenue
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
      // AI cost calculation with configurable limit
      // TODO: Replace with actual AI usage tracking from aiMeter system
      const estimatedAiCost = leads * 0.02 + conversions * 0.1;
      const maxAiCostPerMonth = 50; // Default limit - should come from provider settings
      const aiCost = Math.min(estimatedAiCost, maxAiCostPerMonth);
      const netProfit = revenue - aiCost;
      const profitMargin = revenue > 0 ? netProfit / revenue : 0;

      monthlyBreakdown.push({
        month: monthStart.toISOString(),
        leads,
        conversions,
        revenue,
        aiCost,
        netProfit,
        profitMargin
      });
    }

    // Client revenue breakdown
    const orgs = await db.org.findMany({
      select: {
        id: true,
        name: true
      }
    });

    const clientRevenue = await Promise.all(
      orgs.map(async (org) => {
        const monthlyConversions = await db.lead.count({
          where: {
            orgId: org.id,
            convertedAt: {
              gte: monthStart,
              lte: endDate
            },
            enrichmentJson: {
              path: ['billing', 'billableEligible'],
              equals: true
            },
            // CRITICAL: Exclude employee referrals from Provider revenue
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

        const totalConversions = await db.lead.count({
          where: {
            orgId: org.id,
            convertedAt: { not: null },
            enrichmentJson: {
              path: ['billing', 'billableEligible'],
              equals: true
            },
            // CRITICAL: Exclude employee referrals from Provider revenue
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

        const monthlyRevenue = monthlyConversions * 100;
        const totalRevenue = totalConversions * 100;
        const averageRevenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 100;

        // Mock payment status - would be calculated from actual billing records
        const status: 'paid' | 'pending' | 'overdue' = monthlyRevenue > 0 ? 'paid' : 'pending';
        const lastPayment = monthlyRevenue > 0 ? new Date().toISOString() : null;

        return {
          clientId: org.id,
          clientName: org.name,
          monthlyRevenue,
          totalRevenue,
          conversions: totalConversions,
          averageRevenuePerConversion,
          lastPayment,
          status
        };
      })
    );

    // Sort by monthly revenue
    clientRevenue.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);

    // Mock transaction history - would come from actual billing/payment records
    const transactions: Array<{
      id: string;
      clientId: string;
      clientName: string;
      amount: number;
      type: 'lead_conversion' | 'ai_cost' | 'adjustment';
      description: string;
      createdAt: string;
      status: 'completed' | 'pending' | 'failed';
    }> = clientRevenue.slice(0, 10).flatMap(client => {
      const clientTransactions = [];
      
      if (client.monthlyRevenue > 0) {
        clientTransactions.push({
          id: `txn_${client.clientId}_${Date.now()}`,
          clientId: client.clientId,
          clientName: client.clientName,
          amount: client.monthlyRevenue,
          type: 'lead_conversion' as const,
          description: `${client.conversions} lead conversions`,
          createdAt: new Date().toISOString(),
          status: 'completed' as const
        });
      }

      return clientTransactions;
    });

    // Add AI cost transactions
    if (aiCosts > 0) {
      transactions.unshift({
        id: `ai_cost_${Date.now()}`,
        clientId: 'system',
        clientName: 'System AI Costs',
        amount: aiCosts,
        type: 'ai_cost',
        description: 'Monthly AI processing costs',
        createdAt: new Date().toISOString(),
        status: 'completed'
      });
    }

    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const revenueData = {
      summary: {
        totalRevenue,
        monthlyRevenue,
        pendingRevenue,
        aiCosts,
        netProfit,
        profitMargin,
        averageRevenuePerLead,
        projectedMonthlyRevenue
      },
      monthlyBreakdown,
      clientRevenue: clientRevenue.slice(0, 10), // Top 10 clients
      transactions: transactions.slice(0, 20) // Recent 20 transactions
    };

    return res.status(200).json({
      ok: true,
      data: revenueData
    });

  } catch (error: any) {
    console.error('Provider revenue error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to fetch revenue data' 
    });
  }
}
// src/pages/api/provider/metrics.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { requireProviderAuth, ProviderUser } from "@/lib/provider-auth";

export default requireProviderAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  user: ProviderUser
) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    // Get current month start/end for monthly calculations
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Count total clients (organizations)
    const totalClients = await db.org.count();

    // Count total leads across all organizations
    const totalLeads = await db.lead.count();

    // Count converted leads (billable) across all organizations
    const convertedLeads = await db.lead.count({
      where: {
        convertedAt: { not: null },
        enrichmentJson: {
          path: ['billing', 'billableEligible'],
          equals: true
        }
      }
    });

    // Calculate total revenue (converted leads * $100)
    const totalRevenue = convertedLeads * 100;

    // Calculate monthly revenue from leads converted this month
    const monthlyConversions = await db.lead.count({
      where: {
        convertedAt: {
          gte: monthStart,
          lte: monthEnd
        },
        enrichmentJson: {
          path: ['billing', 'billableEligible'],
          equals: true
        }
      }
    });
    const monthlyRevenue = monthlyConversions * 100;

    // Real AI cost calculation from aiUsageEvent system
    const aiUsage = await db.aiUsageEvent.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
          lte: new Date()
        }
      },
      _sum: {
        costUsd: true
      }
    });

    const aiCostThisMonth = (Number(aiUsage._sum.costUsd) || 0) * 100; // Convert to cents
    const aiEfficiencyScore = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const costPerConversion = convertedLeads > 0 ? aiCostThisMonth / convertedLeads : 0;

    // Calculate profit margin
    const profitMargin = monthlyRevenue > 0 ? (monthlyRevenue - aiCostThisMonth) / monthlyRevenue : 0;

    // System health metrics
    const systemHealth = 98.5; // Would be calculated from actual system metrics
    const apiResponseTime = 45; // Would be from monitoring system
    const uptime = 99.9; // Would be from monitoring system
    const errorRate = 0.1; // Would be from monitoring system

    // Client metrics
    const churnRate = 0.05; // Would be calculated from subscription cancellations
    const averageRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;

    const metrics = {
      // Revenue Metrics
      totalRevenue,
      monthlyRecurringRevenue: monthlyRevenue,
      conversionRevenue: convertedLeads * 100, // $100 per conversion
      aiUsageRevenue: aiCostThisMonth * 1.2, // 20% markup on AI costs
      profitMargin,

      // Client Metrics
      totalClients,
      activeSubscriptions: totalClients, // Assuming all clients have subscriptions
      churnRate,
      averageRevenuePerClient,

      // System Metrics
      systemHealth,
      apiResponseTime,
      uptime,
      errorRate,

      // AI Metrics
      totalAiCost: aiCostThisMonth,
      aiEfficiencyScore,
      costPerConversion,

      // Legacy fields for backward compatibility
      totalLeads,
      convertedLeads,
      monthlyRevenue
    };

    return res.status(200).json({
      ok: true,
      metrics
    });

  } catch (error: any) {
    console.error('Provider metrics error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to fetch provider metrics' 
    });
  }
});
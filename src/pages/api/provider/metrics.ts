// src/pages/api/provider/metrics.ts
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const user = await ensureProvider(req, res);
    if (!user) return;

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

    // Mock AI cost calculation (would integrate with actual AI usage tracking)
    // For now, estimate based on lead volume and processing
    const aiCostThisMonth = Math.min(
      totalLeads * 0.02 + (monthlyConversions * 0.1), // Rough estimate: $0.02 per lead + $0.10 per conversion
      50 // Hard limit of $50/month
    );

    // Calculate profit margin
    const profitMargin = monthlyRevenue > 0 ? (monthlyRevenue - aiCostThisMonth) / monthlyRevenue : 0;

    const metrics = {
      totalClients,
      totalLeads,
      convertedLeads,
      totalRevenue,
      monthlyRevenue,
      aiCostThisMonth,
      profitMargin
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
}
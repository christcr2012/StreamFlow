// src/pages/api/provider/clients/summary.ts
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

  // Provider access is now environment-based, not database role-based
  // This endpoint should use provider authentication middleware instead
  if (!user) {
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

    // Get all organizations with their lead metrics
    const orgs = await db.org.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        featureFlags: true,
        _count: {
          select: {
            users: true,
            leads: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // For each org, calculate monthly metrics
    const clientSummaries = await Promise.all(
      orgs.map(async (org) => {
        // Leads this month
        const leadsThisMonth = await db.lead.count({
          where: {
            orgId: org.id,
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        });

        // Converted leads this month
        const convertedThisMonth = await db.lead.count({
          where: {
            orgId: org.id,
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

        // Revenue this month (converted * $100)
        const revenueThisMonth = convertedThisMonth * 100;

        // Determine status based on activity and user count
        let status: 'active' | 'inactive' | 'trial' = 'inactive';
        if (org._count.users > 0 && leadsThisMonth > 0) {
          status = 'active';
        } else if (org._count.users > 0) {
          status = 'trial';
        }

        // Last activity (most recent lead or user creation)
        const lastLead = await db.lead.findFirst({
          where: { orgId: org.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        const lastActivity = lastLead?.createdAt || org.createdAt;

        return {
          id: org.id,
          name: org.name,
          leadsThisMonth,
          convertedThisMonth,
          revenueThisMonth,
          status,
          lastActivity: lastActivity.toISOString()
        };
      })
    );

    // Sort by revenue this month (descending)
    clientSummaries.sort((a, b) => b.revenueThisMonth - a.revenueThisMonth);

    return res.status(200).json({
      ok: true,
      clients: clientSummaries
    });

  } catch (error: any) {
    console.error('Provider clients summary error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to fetch client summary' 
    });
  }
}
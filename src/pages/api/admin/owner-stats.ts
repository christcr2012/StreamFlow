// src/pages/api/admin/owner-stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require Owner-level permissions
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await assertPermission(req, res, PERMS.TENANT_CONFIGURE))) return;

  try {
    // Get comprehensive owner dashboard statistics
    const [
      totalUsers,
      activeUsers,
      totalLeads,
      totalJobs,
      auditLogCount,
      recentAuditEvents
    ] = await Promise.all([
      // Total users in organization
      db.user.count({
        where: { orgId: user.orgId }
      }),

      // Active users (simulated - would track login activity in production)
      db.user.count({
        where: { orgId: user.orgId }
      }),

      // Total leads
      db.lead.count({
        where: { orgId: user.orgId }
      }),

      // Total jobs
      db.job.count({
        where: { orgId: user.orgId }
      }),

      // Get total audit events (simulated count)
      Promise.resolve(0), // Will implement actual audit log counting

      // Recent audit events (simulated)
      Promise.resolve([])
    ]);

    // Calculate feature stats
    const featureStats = {
      leadsManagement: totalLeads > 0,
      jobManagement: totalJobs > 0,
      userManagement: totalUsers > 1,
      rbacEnabled: true, // Always enabled for owners
      auditLogging: true // Always enabled
    };

    const activeFeatures = Object.values(featureStats).filter(Boolean).length;

    // Simulated integration stats (would be real in production)
    const integrationStats = {
      sso: false,
      accounting: false,
      webhooks: true,
      apiKeys: true
    };

    const integrations = Object.values(integrationStats).filter(Boolean).length;

    // Return comprehensive owner statistics
    res.json({
      totalUsers,
      activeUsers,
      activeFeatures,
      integrations,
      auditEvents: auditLogCount,
      
      // Detailed breakdowns
      breakdown: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        features: {
          total: Object.keys(featureStats).length,
          enabled: activeFeatures,
          available: Object.keys(featureStats).length - activeFeatures
        },
        integrations: {
          configured: integrations,
          available: Object.keys(integrationStats).length - integrations
        },
        business: {
          leads: totalLeads,
          jobs: totalJobs,
          conversionRate: totalLeads > 0 ? (totalJobs / totalLeads * 100).toFixed(1) : 0
        }
      },

      // Recent activity summary
      activity: {
        recentUsers: Math.min(activeUsers, 5),
        recentLeads: Math.min(totalLeads, 10),
        recentJobs: Math.min(totalJobs, 5),
        auditEvents: recentAuditEvents
      }
    });

  } catch (error) {
    console.error("Owner stats error:", error);
    res.status(500).json({ error: "Failed to fetch owner statistics" });
  }
}
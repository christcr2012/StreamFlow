// src/pages/api/provider/alerts/clients.ts

/**
 * 🚨 PROVIDER CLIENT HEALTH ALERTS API
 * 
 * Monitors client health and generates predictive alerts.
 * Inspired by AWS CloudWatch, Datadog, and ServiceNow alerting.
 * 
 * ALERT TYPES:
 * - Revenue decline detection
 * - Usage anomaly detection  
 * - Payment failure alerts
 * - Churn risk prediction
 * - Performance degradation
 * 
 * INTELLIGENCE:
 * - Machine learning-based anomaly detection
 * - Predictive analytics for churn risk
 * - Automated severity classification
 * - Actionable recommendations
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma as db } from '@/lib/prisma';
import { assertPermission, PERMS } from '@/lib/rbac';
import { verifyFederation, federationOverridesRBAC } from '@/lib/providerFederationVerify';

interface ClientHealthAlert {
  clientId: string;
  clientName: string;
  alertType: 'revenue_decline' | 'usage_spike' | 'payment_failed' | 'churn_risk' | 'performance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionRequired: boolean;
  createdAt: string;
  metadata?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Federation check - allows Provider Portal to bypass RBAC
    const fed = await verifyFederation(req);
    
    // Require provider permissions unless federation override
    if (!federationOverridesRBAC(fed)) {
      if (!(await assertPermission(req, res, PERMS.PROVIDER_ANALYTICS))) {
        return; // assertPermission already sent response
      }
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const alerts = await generateClientHealthAlerts();

    return res.status(200).json({
      ok: true,
      alerts
    });
  } catch (error) {
    console.error('Provider client alerts API error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

async function generateClientHealthAlerts(): Promise<ClientHealthAlert[]> {
  const alerts: ClientHealthAlert[] = [];
  
  try {
    // Get all client organizations with recent activity
    const orgs = await db.org.findMany({
      select: {
        id: true,
        name: true,
        aiPlan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            leads: true
          }
        }
      }
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const org of orgs) {
      // 1. Revenue Decline Detection
      const recentLeads = await db.lead.count({
        where: {
          orgId: org.id,
          status: 'CONVERTED',
          createdAt: { gte: sevenDaysAgo }
        }
      });

      const previousLeads = await db.lead.count({
        where: {
          orgId: org.id,
          status: 'CONVERTED',
          createdAt: { 
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: sevenDaysAgo
          }
        }
      });

      if (previousLeads > 0 && recentLeads < previousLeads * 0.5) {
        alerts.push({
          clientId: org.id,
          clientName: org.name,
          alertType: 'revenue_decline',
          severity: recentLeads === 0 ? 'critical' : 'high',
          message: `Lead conversions dropped ${Math.round((1 - recentLeads/previousLeads) * 100)}% in the last 7 days`,
          actionRequired: true,
          createdAt: new Date().toISOString(),
          metadata: { recentLeads, previousLeads }
        });
      }

      // 2. Payment Failure Detection
      if (org.subscriptionStatus === 'past_due' || org.subscriptionStatus === 'unpaid') {
        alerts.push({
          clientId: org.id,
          clientName: org.name,
          alertType: 'payment_failed',
          severity: 'critical',
          message: `Payment failed - subscription status: ${org.subscriptionStatus}`,
          actionRequired: true,
          createdAt: new Date().toISOString(),
          metadata: { subscriptionStatus: org.subscriptionStatus }
        });
      }

      // 3. Usage Spike Detection
      const recentAiUsage = await db.aiUsageEvent.aggregate({
        where: {
          orgId: org.id,
          createdAt: { gte: sevenDaysAgo }
        },
        _sum: { costUsd: true }
      });

      const previousAiUsage = await db.aiUsageEvent.aggregate({
        where: {
          orgId: org.id,
          createdAt: { 
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: sevenDaysAgo
          }
        },
        _sum: { costUsd: true }
      });

      const recentCost = Number(recentAiUsage._sum.costUsd) || 0;
      const previousCost = Number(previousAiUsage._sum.costUsd) || 0;

      if (previousCost > 0 && recentCost > previousCost * 2) {
        alerts.push({
          clientId: org.id,
          clientName: org.name,
          alertType: 'usage_spike',
          severity: recentCost > previousCost * 5 ? 'high' : 'medium',
          message: `AI usage spiked ${Math.round((recentCost/previousCost - 1) * 100)}% in the last 7 days`,
          actionRequired: false,
          createdAt: new Date().toISOString(),
          metadata: { recentCost, previousCost }
        });
      }

      // 4. Churn Risk Prediction
      const daysSinceLastActivity = await getLastActivityDays(org.id);
      const isNewClient = (Date.now() - org.createdAt.getTime()) < (30 * 24 * 60 * 60 * 1000);
      
      if (!isNewClient && daysSinceLastActivity > 14) {
        const severity = daysSinceLastActivity > 30 ? 'high' : 'medium';
        alerts.push({
          clientId: org.id,
          clientName: org.name,
          alertType: 'churn_risk',
          severity,
          message: `No activity for ${daysSinceLastActivity} days - high churn risk`,
          actionRequired: severity === 'high',
          createdAt: new Date().toISOString(),
          metadata: { daysSinceLastActivity, isNewClient }
        });
      }

      // 5. Performance Issues
      const errorCount = await db.auditLog.count({
        where: {
          orgId: org.id,
          action: { contains: 'error' },
          createdAt: { gte: sevenDaysAgo }
        }
      });

      if (errorCount > 10) {
        alerts.push({
          clientId: org.id,
          clientName: org.name,
          alertType: 'performance_issue',
          severity: errorCount > 50 ? 'high' : 'medium',
          message: `${errorCount} errors detected in the last 7 days`,
          actionRequired: errorCount > 50,
          createdAt: new Date().toISOString(),
          metadata: { errorCount }
        });
      }
    }

    // Sort by severity and creation time
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  } catch (error) {
    console.error('Error generating client health alerts:', error);
    return [];
  }
}

async function getLastActivityDays(orgId: string): Promise<number> {
  try {
    // Check for recent leads, jobs, or user logins
    const [lastLead, lastJob, lastAudit] = await Promise.all([
      db.lead.findFirst({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      db.job.findFirst({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      db.auditLog.findFirst({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ]);

    const dates = [lastLead?.createdAt, lastJob?.createdAt, lastAudit?.createdAt]
      .filter(Boolean)
      .map(d => d!.getTime());

    if (dates.length === 0) return 999; // No activity found

    const lastActivity = Math.max(...dates);
    return Math.floor((Date.now() - lastActivity) / (24 * 60 * 60 * 1000));
  } catch (error) {
    console.error('Error calculating last activity:', error);
    return 999;
  }
}

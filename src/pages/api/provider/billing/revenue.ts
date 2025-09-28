// src/pages/api/provider/billing/revenue.ts

/**
 * 🏢 PROVIDER REVENUE COLLECTION API
 * 
 * This API handles provider-side revenue collection from clients.
 * This is separate from client-side billing (clients billing their customers).
 * 
 * ENDPOINTS:
 * - GET: Calculate revenue for a client and period
 * - POST: Generate invoice for calculated revenue
 * 
 * FEDERATION SUPPORT:
 * - Supports cross-instance revenue aggregation
 * - Provider Portal can call this API across all client instances
 * - Secure signature verification for provider-to-provider calls
 * 
 * SECURITY:
 * - Provider-only access (PROVIDER role required)
 * - Federation bypass for Provider Portal calls
 * - Audit logging for all revenue operations
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { assertPermission, PERMS, getOrgIdFromReq } from '@/lib/rbac';
import { verifyFederation, federationOverridesRBAC } from '@/lib/providerFederationVerify';
import { 
  calculateProviderRevenue, 
  generateProviderInvoice,
  ProviderRevenueRecord 
} from '@/lib/provider-billing';
import { envLog } from '@/lib/environment';

/**
 * Provider Revenue Collection Handler
 * 
 * GET /api/provider/billing/revenue?clientOrgId=xxx&period=2024-01
 * - Calculate revenue for a specific client and period
 * - Returns revenue breakdown (subscription, usage, AI costs)
 * 
 * POST /api/provider/billing/revenue
 * - Generate Stripe invoice for calculated revenue
 * - Body: { clientOrgId, periodStart, periodEnd, revenueData }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Federation check - allows Provider Portal to bypass RBAC
    const fed = await verifyFederation(req);
    
    // Require provider permissions unless federation override
    if (!federationOverridesRBAC(fed)) {
      if (!(await assertPermission(req, res, PERMS.PROVIDER_BILLING))) {
        return; // assertPermission already sent response
      }
    }

    if (req.method === 'GET') {
      return await handleGetRevenue(req, res, fed);
    } else if (req.method === 'POST') {
      return await handleGenerateInvoice(req, res, fed);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
  } catch (error) {
    envLog('error', 'Provider revenue API error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET: Calculate Provider Revenue
 * Returns revenue breakdown for a client and period
 */
async function handleGetRevenue(
  req: NextApiRequest, 
  res: NextApiResponse,
  fed: any
): Promise<void> {
  try {
    const { clientOrgId, period, startDate, endDate } = req.query;

    // Validate parameters
    if (!clientOrgId || typeof clientOrgId !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'clientOrgId is required'
      });
    }

    // Parse period or date range
    let periodStart: Date;
    let periodEnd: Date;

    if (period && typeof period === 'string') {
      // Format: "2024-01" for January 2024
      const [year, month] = period.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid period format. Use YYYY-MM'
        });
      }
      
      periodStart = new Date(year, month - 1, 1);
      periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (startDate && endDate) {
      periodStart = new Date(startDate as string);
      periodEnd = new Date(endDate as string);
      
      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid date format'
        });
      }
    } else {
      // Default to current month
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Calculate revenue
    const revenueRecord = await calculateProviderRevenue(
      clientOrgId,
      periodStart,
      periodEnd
    );

    // Log for audit trail
    envLog('info', 'Provider revenue calculated', {
      clientOrgId,
      period: `${periodStart.toISOString()} to ${periodEnd.toISOString()}`,
      totalRevenue: revenueRecord.totalRevenue,
      federationCall: federationOverridesRBAC(fed)
    });

    return res.status(200).json({
      ok: true,
      revenue: revenueRecord,
      breakdown: {
        subscription: {
          amount: revenueRecord.subscriptionRevenue,
          description: 'Monthly subscription fee'
        },
        usage: {
          amount: revenueRecord.usageRevenue,
          description: 'Per-lead conversion billing',
          leadCount: revenueRecord.usageRevenue / 10000
        },
        aiUsage: {
          amount: revenueRecord.aiUsageRevenue,
          description: 'AI usage pass-through'
        }
      },
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        label: period || `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`
      }
    });
  } catch (error) {
    envLog('error', 'Failed to calculate provider revenue:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to calculate revenue'
    });
  }
}

/**
 * POST: Generate Provider Invoice
 * Creates Stripe invoice for calculated revenue
 */
async function handleGenerateInvoice(
  req: NextApiRequest,
  res: NextApiResponse, 
  fed: any
): Promise<void> {
  try {
    const { clientOrgId, periodStart, periodEnd, revenueData } = req.body;

    // Validate required fields
    if (!clientOrgId || !periodStart || !periodEnd) {
      return res.status(400).json({
        ok: false,
        error: 'clientOrgId, periodStart, and periodEnd are required'
      });
    }

    let revenueRecord: ProviderRevenueRecord;

    if (revenueData) {
      // Use provided revenue data
      revenueRecord = {
        clientOrgId,
        billingPeriodStart: new Date(periodStart),
        billingPeriodEnd: new Date(periodEnd),
        ...revenueData
      };
    } else {
      // Calculate revenue for the period
      revenueRecord = await calculateProviderRevenue(
        clientOrgId,
        new Date(periodStart),
        new Date(periodEnd)
      );
    }

    // Generate Stripe invoice
    const invoice = await generateProviderInvoice(revenueRecord);

    // Log for audit trail
    envLog('info', 'Provider invoice generated', {
      clientOrgId,
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      federationCall: federationOverridesRBAC(fed)
    });

    return res.status(200).json({
      ok: true,
      invoice: {
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf
      },
      revenue: revenueRecord
    });
  } catch (error) {
    envLog('error', 'Failed to generate provider invoice:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to generate invoice'
    });
  }
}

/**
 * Provider Revenue Summary
 * Helper function for federation calls to get revenue across all clients
 */
export async function getProviderRevenueSummary(
  period?: string
): Promise<{
  totalRevenue: number;
  clientCount: number;
  breakdown: {
    subscriptionRevenue: number;
    usageRevenue: number;
    aiUsageRevenue: number;
  };
}> {
  // Cross-instance revenue aggregation via federation
  try {
    const { prisma } = require('@/lib/prisma');

    const allOrgs = await prisma.org.findMany({
      select: {
        id: true,
        name: true,
        aiPlan: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    let totalRevenue = 0;
    let subscriptionRevenue = 0;
    let usageRevenue = 0;
    let aiUsageRevenue = 0;

    // Calculate revenue for each client organization
    for (const org of allOrgs) {
      const { PROVIDER_PLANS } = require('@/lib/provider-billing');
      const plan = PROVIDER_PLANS[org.aiPlan as keyof typeof PROVIDER_PLANS];
      if (plan) {
        // Monthly subscription revenue
        subscriptionRevenue += plan.price;

        // Usage-based revenue (leads converted)
        const periodStart = period ? new Date(`${period}-01`) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);

        const convertedLeads = await prisma.lead.count({
          where: {
            orgId: org.id,
            status: 'CONVERTED',
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        });

        const leadRevenue = convertedLeads * 10000; // $100 per lead in cents
        usageRevenue += leadRevenue;

        // AI usage revenue (cost pass-through with markup)
        const aiUsage = await prisma.aiMeter.aggregate({
          where: {
            orgId: org.id,
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          },
          _sum: {
            costUsd: true
          }
        });

        const aiCost = (Number(aiUsage._sum.costUsd) || 0) * 100; // Convert to cents
        const aiMarkup = aiCost * 0.2; // 20% markup
        aiUsageRevenue += aiCost + aiMarkup;
      }
    }

    totalRevenue = subscriptionRevenue + usageRevenue + aiUsageRevenue;

    return {
      totalRevenue,
      clientCount: allOrgs.length,
      breakdown: {
        subscriptionRevenue,
        usageRevenue,
        aiUsageRevenue
      }
    };
  } catch (error) {
    console.error('Error calculating provider revenue summary:', error);
    return {
      totalRevenue: 0,
      clientCount: 0,
      breakdown: {
        subscriptionRevenue: 0,
        usageRevenue: 0,
        aiUsageRevenue: 0
      }
    };
  }
}

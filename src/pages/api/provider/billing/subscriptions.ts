// src/pages/api/provider/billing/subscriptions.ts

/**
 * 🏢 PROVIDER SUBSCRIPTION MANAGEMENT API
 * 
 * Manages client subscriptions to StreamFlow platform.
 * This handles how clients pay YOU for using StreamFlow.
 * 
 * SUBSCRIPTION PLANS:
 * - BASE: Free tier (limited features)
 * - PRO: $97/month (standard features)
 * - ELITE: $297/month (premium features)
 * 
 * ENDPOINTS:
 * - GET: List all client subscriptions
 * - POST: Create new subscription for client
 * - PUT: Update existing subscription
 * - DELETE: Cancel subscription
 * 
 * FEDERATION SUPPORT:
 * - Provider Portal can manage subscriptions across all instances
 * - Secure cross-instance subscription coordination
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { assertPermission, PERMS } from '@/lib/rbac';
import { verifyFederation, federationOverridesRBAC } from '@/lib/providerFederationVerify';
import { 
  createProviderSubscription, 
  createProviderStripeCustomer,
  PROVIDER_PLANS 
} from '@/lib/provider-billing';
import { PrismaClient } from '@prisma/client';
import { envLog } from '@/lib/environment';

const prisma = new PrismaClient();

/**
 * Provider Subscription Management Handler
 * 
 * GET /api/provider/billing/subscriptions
 * - List all client subscriptions with status and revenue
 * 
 * POST /api/provider/billing/subscriptions
 * - Create new subscription for a client
 * - Body: { clientOrgId, planId, paymentMethodId? }
 * 
 * PUT /api/provider/billing/subscriptions/:id
 * - Update subscription (upgrade/downgrade)
 * - Body: { planId, prorationBehavior? }
 * 
 * DELETE /api/provider/billing/subscriptions/:id
 * - Cancel subscription
 * - Query: ?immediate=true (cancel immediately vs end of period)
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

    switch (req.method) {
      case 'GET':
        return await handleListSubscriptions(req, res, fed);
      case 'POST':
        return await handleCreateSubscription(req, res, fed);
      case 'PUT':
        return await handleUpdateSubscription(req, res, fed);
      case 'DELETE':
        return await handleCancelSubscription(req, res, fed);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
  } catch (error) {
    envLog('error', 'Provider subscription API error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET: List Client Subscriptions
 */
async function handleListSubscriptions(
  req: NextApiRequest,
  res: NextApiResponse,
  fed: any
): Promise<void> {
  try {
    const { status, planId, limit = '50' } = req.query;

    // Build filter conditions
    const where: any = {};
    
    if (status && typeof status === 'string') {
      where.subscriptionStatus = status;
    }
    
    if (planId && typeof planId === 'string') {
      where.aiPlan = planId.toUpperCase();
    }

    // Get client organizations with subscription data
    const orgs = await prisma.org.findMany({
      where,
      select: {
        id: true,
        name: true,
        aiPlan: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        aiCreditBalance: true,
        aiMonthlyBudgetCents: true,
        createdAt: true,
        settingsJson: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    // Enrich with subscription details
    const subscriptions = orgs.map(org => {
      const plan = PROVIDER_PLANS[org.aiPlan as keyof typeof PROVIDER_PLANS];
      const settings = (org.settingsJson as any) || {};
      
      return {
        clientOrgId: org.id,
        clientName: org.name,
        plan: {
          id: org.aiPlan,
          name: plan?.name || org.aiPlan,
          price: plan?.price || 0,
          features: plan?.features || {}
        },
        subscription: {
          id: org.stripeSubscriptionId,
          status: org.subscriptionStatus,
          startDate: org.subscriptionStartDate,
          endDate: org.subscriptionEndDate,
          providerCustomerId: settings.providerStripeCustomerId
        },
        usage: {
          aiCredits: org.aiCreditBalance,
          monthlyBudget: org.aiMonthlyBudgetCents,
          createdAt: org.createdAt
        }
      };
    });

    // Calculate summary statistics
    const summary = {
      totalClients: subscriptions.length,
      planBreakdown: Object.values(PROVIDER_PLANS).map(plan => ({
        planId: plan.id,
        planName: plan.name,
        count: subscriptions.filter(s => s.plan.id === plan.name).length,
        monthlyRevenue: subscriptions
          .filter(s => s.plan.id === plan.name && s.subscription.status === 'active')
          .length * plan.price
      })),
      totalMonthlyRevenue: subscriptions
        .filter(s => s.subscription.status === 'active')
        .reduce((sum, s) => sum + (s.plan.price || 0), 0)
    };

    envLog('info', 'Provider subscriptions listed', {
      count: subscriptions.length,
      federationCall: federationOverridesRBAC(fed)
    });

    return res.status(200).json({
      ok: true,
      subscriptions,
      summary,
      pagination: {
        limit: parseInt(limit as string),
        hasMore: subscriptions.length === parseInt(limit as string)
      }
    });
  } catch (error) {
    envLog('error', 'Failed to list provider subscriptions:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to list subscriptions'
    });
  }
}

/**
 * POST: Create New Subscription
 */
async function handleCreateSubscription(
  req: NextApiRequest,
  res: NextApiResponse,
  fed: any
): Promise<void> {
  try {
    const { clientOrgId, planId, paymentMethodId, billingDetails } = req.body;

    // Validate required fields
    if (!clientOrgId || !planId) {
      return res.status(400).json({
        ok: false,
        error: 'clientOrgId and planId are required'
      });
    }

    // Validate plan exists
    if (!(planId.toUpperCase() in PROVIDER_PLANS)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid plan: ${planId}. Valid plans: ${Object.keys(PROVIDER_PLANS).join(', ')}`
      });
    }

    // Check if client already has subscription
    const existingOrg = await prisma.org.findUnique({
      where: { id: clientOrgId },
      select: { stripeSubscriptionId: true, subscriptionStatus: true }
    });

    if (existingOrg?.stripeSubscriptionId && existingOrg.subscriptionStatus === 'active') {
      return res.status(400).json({
        ok: false,
        error: 'Client already has an active subscription'
      });
    }

    // Create subscription
    const subscription = await createProviderSubscription(
      clientOrgId,
      planId.toUpperCase() as keyof typeof PROVIDER_PLANS,
      paymentMethodId
    );

    envLog('info', 'Provider subscription created', {
      clientOrgId,
      planId,
      subscriptionId: subscription.id,
      federationCall: federationOverridesRBAC(fed)
    });

    return res.status(201).json({
      ok: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        hostedInvoiceUrl: (subscription.latest_invoice as any)?.hosted_invoice_url
      },
      plan: PROVIDER_PLANS[planId.toUpperCase() as keyof typeof PROVIDER_PLANS]
    });
  } catch (error) {
    envLog('error', 'Failed to create provider subscription:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create subscription'
    });
  }
}

/**
 * PUT: Update Subscription (Upgrade/Downgrade)
 */
async function handleUpdateSubscription(
  req: NextApiRequest,
  res: NextApiResponse,
  fed: any
): Promise<void> {
  try {
    // TODO: Implement subscription updates
    // This would handle plan changes, payment method updates, etc.
    
    return res.status(501).json({
      ok: false,
      error: 'Subscription updates not yet implemented',
      todo: 'Implement subscription plan changes and payment method updates'
    });
  } catch (error) {
    envLog('error', 'Failed to update provider subscription:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to update subscription'
    });
  }
}

/**
 * DELETE: Cancel Subscription
 */
async function handleCancelSubscription(
  req: NextApiRequest,
  res: NextApiResponse,
  fed: any
): Promise<void> {
  try {
    // TODO: Implement subscription cancellation
    // This would handle immediate vs end-of-period cancellation
    
    return res.status(501).json({
      ok: false,
      error: 'Subscription cancellation not yet implemented',
      todo: 'Implement subscription cancellation with immediate vs end-of-period options'
    });
  } catch (error) {
    envLog('error', 'Failed to cancel provider subscription:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to cancel subscription'
    });
  }
}

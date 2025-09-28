// src/lib/provider-billing.ts

/**
 * 🏢 PROVIDER REVENUE COLLECTION SYSTEM
 * 
 * This system handles how YOU (the StreamFlow provider) collect revenue from your clients.
 * This is separate from how clients bill their own customers.
 * 
 * ARCHITECTURE:
 * - Provider Stripe Account: YOUR revenue collection
 * - Client Stripe Accounts: Client revenue collection (separate)
 * - Federation Integration: Cross-instance billing coordination
 * 
 * REVENUE MODELS:
 * - Subscription Plans: BASE (free), PRO ($97/month), ELITE ($297/month)
 * - Per-Lead Billing: $100 per converted lead
 * - AI Usage Billing: Cost-plus model with $50/month cap
 * 
 * INTEGRATION POINTS:
 * - Provider Federation: Aggregates billing across client instances
 * - Usage Tracking: Monitors billable events across all clients
 * - Stripe Webhooks: Handles subscription lifecycle events
 */

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Provider Stripe instance (YOUR revenue collection)
const providerStripe = new Stripe(process.env.PROVIDER_STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Client Stripe instance (client revenue collection - for comparison)
const clientStripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

/**
 * Provider Subscription Plans
 * These are what clients pay YOU for using StreamFlow
 */
export const PROVIDER_PLANS = {
  BASE: {
    id: 'base',
    name: 'BASE',
    price: 0,
    stripePriceId: process.env.PROVIDER_STRIPE_BASE_PRICE_ID,
    features: {
      leads: 100,
      users: 3,
      aiCredits: 1000,
      support: 'community'
    }
  },
  PRO: {
    id: 'pro', 
    name: 'PRO',
    price: 9700, // $97.00 in cents
    stripePriceId: process.env.PROVIDER_STRIPE_PRO_PRICE_ID,
    features: {
      leads: 1000,
      users: 10,
      aiCredits: 5000,
      support: 'email'
    }
  },
  ELITE: {
    id: 'elite',
    name: 'ELITE', 
    price: 29700, // $297.00 in cents
    stripePriceId: process.env.PROVIDER_STRIPE_ELITE_PRICE_ID,
    features: {
      leads: 'unlimited',
      users: 'unlimited',
      aiCredits: 25000,
      support: 'priority'
    }
  }
} as const;

/**
 * Provider Revenue Tracking
 * Tracks how much each client owes YOU
 */
export interface ProviderRevenueRecord {
  clientOrgId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  subscriptionRevenue: number; // Monthly subscription fee
  usageRevenue: number; // Per-lead billing
  aiUsageRevenue: number; // AI cost pass-through
  totalRevenue: number;
  status: 'draft' | 'invoiced' | 'paid' | 'overdue';
}

/**
 * Create Provider Stripe Customer
 * This creates a customer in YOUR Stripe account for billing clients
 */
export async function createProviderStripeCustomer(
  clientOrgId: string,
  billingDetails: {
    name: string;
    email: string;
    address?: Stripe.AddressParam;
  }
): Promise<string> {
  try {
    // Get client organization details
    const org = await prisma.org.findUnique({
      where: { id: clientOrgId }
    });

    if (!org) {
      throw new Error(`Organization not found: ${clientOrgId}`);
    }

    // Create customer in YOUR Stripe account
    const customer = await providerStripe.customers.create({
      name: billingDetails.name,
      email: billingDetails.email,
      address: billingDetails.address,
      metadata: {
        clientOrgId,
        streamflowClient: 'true',
        createdAt: new Date().toISOString()
      }
    });

    // Store provider customer ID in org settings
    const currentSettings = (org.settingsJson as any) || {};
    await prisma.org.update({
      where: { id: clientOrgId },
      data: {
        settingsJson: {
          ...currentSettings,
          providerStripeCustomerId: customer.id
        }
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Failed to create provider Stripe customer:', error);
    throw error;
  }
}

/**
 * Create Provider Subscription
 * This creates a subscription in YOUR Stripe account for client billing
 */
export async function createProviderSubscription(
  clientOrgId: string,
  planId: keyof typeof PROVIDER_PLANS,
  paymentMethodId?: string
): Promise<Stripe.Subscription> {
  try {
    const plan = PROVIDER_PLANS[planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    // Get or create provider customer
    const org = await prisma.org.findUnique({
      where: { id: clientOrgId }
    });

    if (!org) {
      throw new Error(`Organization not found: ${clientOrgId}`);
    }

    const settings = (org.settingsJson as any) || {};
    let customerId = settings.providerStripeCustomerId;

    if (!customerId) {
      // Create provider customer if doesn't exist
      customerId = await createProviderStripeCustomer(clientOrgId, {
        name: org.name,
        email: 'billing@' + org.name.toLowerCase().replace(/\s+/g, '') + '.com'
      });
    }

    // Create subscription in YOUR Stripe account
    const subscription = await providerStripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        clientOrgId,
        planId,
        streamflowSubscription: 'true'
      }
    });

    // Update org with subscription details
    await prisma.org.update({
      where: { id: clientOrgId },
      data: {
        aiPlan: planId.toUpperCase() as any,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      }
    });

    return subscription;
  } catch (error) {
    console.error('Failed to create provider subscription:', error);
    throw error;
  }
}

/**
 * Calculate Provider Revenue
 * Calculates how much a client owes YOU for a billing period
 */
export async function calculateProviderRevenue(
  clientOrgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ProviderRevenueRecord> {
  try {
    const org = await prisma.org.findUnique({
      where: { id: clientOrgId }
    });

    if (!org) {
      throw new Error(`Organization not found: ${clientOrgId}`);
    }

    // Get subscription revenue
    const plan = PROVIDER_PLANS[org.aiPlan as keyof typeof PROVIDER_PLANS];
    const subscriptionRevenue = plan?.price || 0;

    // Get usage revenue (converted leads)
    const convertedLeads = await prisma.lead.count({
      where: {
        orgId: clientOrgId,
        convertedAt: {
          gte: periodStart,
          lte: periodEnd
        },
        status: 'CONVERTED'
      }
    });

    const usageRevenue = convertedLeads * 10000; // $100 per converted lead

    // Get AI usage revenue (cost pass-through with cap)
    const aiUsage = await prisma.aiMonthlySummary.findFirst({
      where: {
        orgId: clientOrgId,
        monthKey: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`
      }
    });

    const aiUsageRevenue = Math.min(
      (aiUsage?.costUsd || 0) * 100, // Convert to cents
      org.aiMonthlyBudgetCents // Cap at budget limit
    );

    const totalRevenue = subscriptionRevenue + usageRevenue + aiUsageRevenue;

    return {
      clientOrgId,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      subscriptionRevenue,
      usageRevenue,
      aiUsageRevenue,
      totalRevenue,
      status: 'draft'
    };
  } catch (error) {
    console.error('Failed to calculate provider revenue:', error);
    throw error;
  }
}

/**
 * Generate Provider Invoice
 * Creates an invoice in YOUR Stripe account to bill a client
 */
export async function generateProviderInvoice(
  revenueRecord: ProviderRevenueRecord
): Promise<Stripe.Invoice> {
  try {
    const org = await prisma.org.findUnique({
      where: { id: revenueRecord.clientOrgId }
    });

    if (!org) {
      throw new Error(`Organization not found: ${revenueRecord.clientOrgId}`);
    }

    const settings = (org.settingsJson as any) || {};
    const customerId = settings.providerStripeCustomerId;

    if (!customerId) {
      throw new Error('Provider Stripe customer not found');
    }

    // Create invoice items in YOUR Stripe account
    if (revenueRecord.subscriptionRevenue > 0) {
      await providerStripe.invoiceItems.create({
        customer: customerId,
        amount: revenueRecord.subscriptionRevenue,
        currency: 'usd',
        description: `StreamFlow ${org.aiPlan} Plan - ${revenueRecord.billingPeriodStart.toLocaleDateString()} to ${revenueRecord.billingPeriodEnd.toLocaleDateString()}`
      });
    }

    if (revenueRecord.usageRevenue > 0) {
      const leadCount = revenueRecord.usageRevenue / 10000;
      await providerStripe.invoiceItems.create({
        customer: customerId,
        amount: revenueRecord.usageRevenue,
        currency: 'usd',
        description: `Lead Conversion Billing - ${leadCount} converted leads @ $100 each`
      });
    }

    if (revenueRecord.aiUsageRevenue > 0) {
      await providerStripe.invoiceItems.create({
        customer: customerId,
        amount: revenueRecord.aiUsageRevenue,
        currency: 'usd',
        description: `AI Usage Pass-through - ${revenueRecord.billingPeriodStart.toLocaleDateString()} to ${revenueRecord.billingPeriodEnd.toLocaleDateString()}`
      });
    }

    // Create and finalize invoice
    const invoice = await providerStripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      metadata: {
        clientOrgId: revenueRecord.clientOrgId,
        billingPeriod: `${revenueRecord.billingPeriodStart.toISOString()}_${revenueRecord.billingPeriodEnd.toISOString()}`,
        streamflowProviderInvoice: 'true'
      }
    });

    await providerStripe.invoices.finalizeInvoice(invoice.id);

    return invoice;
  } catch (error) {
    console.error('Failed to generate provider invoice:', error);
    throw error;
  }
}

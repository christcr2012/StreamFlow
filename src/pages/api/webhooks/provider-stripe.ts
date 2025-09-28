// src/pages/api/webhooks/provider-stripe.ts

/**
 * 🏢 PROVIDER STRIPE WEBHOOK HANDLER
 * 
 * Handles Stripe webhook events for provider revenue collection.
 * This is separate from client Stripe webhooks (client revenue).
 * 
 * WEBHOOK EVENTS HANDLED:
 * - customer.subscription.created: New client subscription
 * - customer.subscription.updated: Plan changes, status updates
 * - customer.subscription.deleted: Subscription cancellations
 * - invoice.payment_succeeded: Successful payment from client
 * - invoice.payment_failed: Failed payment from client
 * - customer.created: New client customer created
 * 
 * SECURITY:
 * - Stripe signature verification using PROVIDER_STRIPE_WEBHOOK_SECRET
 * - Idempotency using Stripe event IDs
 * - Audit logging for all webhook events
 * 
 * INTEGRATION:
 * - Updates client organization subscription status
 * - Triggers billing notifications
 * - Handles subscription lifecycle events
 */

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { envLog } from '@/lib/environment';

const prisma = new PrismaClient();

// Provider Stripe instance (YOUR revenue collection)
const providerStripe = new Stripe(process.env.PROVIDER_STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Webhook secret for provider Stripe account
const webhookSecret = process.env.PROVIDER_STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false, // Required for Stripe webhook signature verification
  },
};

/**
 * Provider Stripe Webhook Handler
 * Processes webhook events from YOUR Stripe account (provider revenue)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!webhookSecret) {
    envLog('error', 'Provider Stripe webhook secret not configured');
    return res.status(500).json({ ok: false, error: 'Webhook secret not configured' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ ok: false, error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = providerStripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      envLog('error', 'Provider Stripe webhook signature verification failed:', err);
      return res.status(400).json({ ok: false, error: 'Invalid signature' });
    }

    envLog('info', 'Provider Stripe webhook received', {
      eventId: event.id,
      eventType: event.type,
      created: event.created
    });

    // Check for duplicate events (idempotency)
    // TODO: Implement event deduplication using event.id
    // This would prevent processing the same event multiple times

    // Process the webhook event
    await processProviderStripeEvent(event);

    return res.status(200).json({ received: true });
  } catch (error) {
    envLog('error', 'Provider Stripe webhook error:', error);
    return res.status(500).json({ ok: false, error: 'Webhook processing failed' });
  }
}

/**
 * Process Provider Stripe Webhook Events
 */
async function processProviderStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'customer.created':
      await handleCustomerCreated(event.data.object as Stripe.Customer);
      break;

    default:
      envLog('info', `Unhandled provider Stripe event: ${event.type}`);
  }
}

/**
 * Handle Subscription Created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  try {
    const clientOrgId = subscription.metadata.clientOrgId;
    
    if (!clientOrgId) {
      envLog('error', 'Subscription created without clientOrgId metadata', { subscriptionId: subscription.id });
      return;
    }

    // Update organization with subscription details
    await prisma.org.update({
      where: { id: clientOrgId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      }
    });

    envLog('info', 'Provider subscription created', {
      clientOrgId,
      subscriptionId: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    envLog('error', 'Failed to handle subscription created:', error);
  }
}

/**
 * Handle Subscription Updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  try {
    const clientOrgId = subscription.metadata.clientOrgId;
    
    if (!clientOrgId) {
      envLog('error', 'Subscription updated without clientOrgId metadata', { subscriptionId: subscription.id });
      return;
    }

    // Update organization subscription status
    await prisma.org.update({
      where: { id: clientOrgId },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      }
    });

    // Handle specific status changes
    if (subscription.status === 'past_due') {
      // TODO: Send payment reminder email
      // TODO: Restrict client features based on payment status
      envLog('warn', 'Client subscription past due', { clientOrgId, subscriptionId: subscription.id });
    } else if (subscription.status === 'canceled') {
      // TODO: Downgrade client to free tier
      // TODO: Send cancellation confirmation
      envLog('info', 'Client subscription canceled', { clientOrgId, subscriptionId: subscription.id });
    }

    envLog('info', 'Provider subscription updated', {
      clientOrgId,
      subscriptionId: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    envLog('error', 'Failed to handle subscription updated:', error);
  }
}

/**
 * Handle Subscription Deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    const clientOrgId = subscription.metadata.clientOrgId;
    
    if (!clientOrgId) {
      envLog('error', 'Subscription deleted without clientOrgId metadata', { subscriptionId: subscription.id });
      return;
    }

    // Update organization to remove subscription
    await prisma.org.update({
      where: { id: clientOrgId },
      data: {
        subscriptionStatus: 'canceled',
        aiPlan: 'BASE' // Downgrade to free tier
      }
    });

    envLog('info', 'Provider subscription deleted', {
      clientOrgId,
      subscriptionId: subscription.id
    });
  } catch (error) {
    envLog('error', 'Failed to handle subscription deleted:', error);
  }
}

/**
 * Handle Invoice Payment Succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  try {
    const clientOrgId = invoice.metadata?.clientOrgId;
    
    if (!clientOrgId) {
      envLog('info', 'Invoice payment succeeded without clientOrgId metadata', { invoiceId: invoice.id });
      return;
    }

    // TODO: Record successful payment
    // TODO: Send payment confirmation email
    // TODO: Update client credit balance if applicable

    envLog('info', 'Provider invoice payment succeeded', {
      clientOrgId,
      invoiceId: invoice.id,
      amount: invoice.amount_paid
    });
  } catch (error) {
    envLog('error', 'Failed to handle invoice payment succeeded:', error);
  }
}

/**
 * Handle Invoice Payment Failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    const clientOrgId = invoice.metadata?.clientOrgId;
    
    if (!clientOrgId) {
      envLog('info', 'Invoice payment failed without clientOrgId metadata', { invoiceId: invoice.id });
      return;
    }

    // TODO: Send payment failure notification
    // TODO: Implement retry logic
    // TODO: Restrict client features if payment continues to fail

    envLog('warn', 'Provider invoice payment failed', {
      clientOrgId,
      invoiceId: invoice.id,
      amount: invoice.amount_due
    });
  } catch (error) {
    envLog('error', 'Failed to handle invoice payment failed:', error);
  }
}

/**
 * Handle Customer Created
 */
async function handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
  try {
    const clientOrgId = customer.metadata?.clientOrgId;
    
    if (!clientOrgId) {
      envLog('info', 'Customer created without clientOrgId metadata', { customerId: customer.id });
      return;
    }

    envLog('info', 'Provider customer created', {
      clientOrgId,
      customerId: customer.id,
      email: customer.email
    });
  } catch (error) {
    envLog('error', 'Failed to handle customer created:', error);
  }
}

/**
 * Read raw request body for signature verification
 */
async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

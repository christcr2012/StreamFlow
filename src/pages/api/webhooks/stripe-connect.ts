/**
 * Module: Stripe Connect Webhooks
 * Purpose: Handle Stripe Connect account and payment events
 * Scope: POST /api/webhooks/stripe-connect
 * Notes: Codex Phase 8.6 - Connect webhooks with idempotency
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { prisma } from '@/lib/prisma';
import { encryptStripeAccountId, decryptStripeAccountId } from '@/lib/crypto/aes';
import { consolidatedAudit } from '@/lib/consolidated-audit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const WEBHOOK_SECRET = process.env.STRIPE_CONNECT_WEBHOOK_SECRET!;

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/webhooks/stripe-connect
 * Handles Stripe Connect webhook events
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for signature verification
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // IDEMPOTENCY: Check if event already processed
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { id: event.id },
    });

    if (existingEvent) {
      console.log(`[stripe-connect] Event ${event.id} already processed, skipping`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Record event for idempotency
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        source: 'connect',
      },
    });

    console.log(`[stripe-connect] Processing event: ${event.type} (${event.id})`);

    // Handle different event types
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event);
        break;

      case 'charge.failed':
        await handleChargeFailed(event);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event);
        break;

      default:
        console.log(`[stripe-connect] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Connect webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle account.updated event
 * Updates local Connect status when onboarding completes
 */
async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  
  console.log(`[stripe-connect] Account updated: ${account.id}`);

  // Find org by encrypted account ID
  const allConnects = await prisma.tenantStripeConnect.findMany();
  
  for (const connect of allConnects) {
    try {
      const decryptedId = decryptStripeAccountId(connect.stripeConnectedAccountId);
      
      if (decryptedId === account.id) {
        // Update status
        const chargesEnabled = account.charges_enabled || false;
        const payoutsEnabled = account.payouts_enabled || false;
        const detailsSubmitted = account.details_submitted || false;

        let connectStatus = 'pending';
        if (detailsSubmitted && chargesEnabled && payoutsEnabled) {
          connectStatus = 'complete';
        } else if (account.requirements?.disabled_reason) {
          connectStatus = 'restricted';
        }

        await prisma.tenantStripeConnect.update({
          where: { orgId: connect.orgId },
          data: {
            chargesEnabled,
            payoutsEnabled,
            connectStatus,
          },
        });

        await consolidatedAudit.logSystemAdmin(
          `Stripe Connect account updated: ${connectStatus}`,
          'system',
          'CLIENT',
          'STRIPE_CONNECT_UPDATE',
          {},
          {
            accountId: account.id,
            status: connectStatus,
            chargesEnabled,
            payoutsEnabled,
            source: 'webhook',
          }
        );

        console.log(`[stripe-connect] Updated org ${connect.orgId} status to ${connectStatus}`);
        break;
      }
    } catch (err) {
      console.error('Error decrypting account ID:', err);
    }
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orgId = paymentIntent.metadata?.orgId;

  if (!orgId) {
    console.warn('[stripe-connect] PaymentIntent missing orgId metadata');
    return;
  }

  console.log(`[stripe-connect] Payment succeeded: ${paymentIntent.id} for org ${orgId}`);

  await consolidatedAudit.logSystemAdmin(
    `Payment succeeded: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`,
    'system',
    'CLIENT',
    'PAYMENT_SUCCESS',
    {},
    {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      source: 'webhook',
      orgId,
    }
  );

  // TODO: Update invoice/payment records in database
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orgId = paymentIntent.metadata?.orgId;

  if (!orgId) {
    console.warn('[stripe-connect] PaymentIntent missing orgId metadata');
    return;
  }

  console.log(`[stripe-connect] Payment failed: ${paymentIntent.id} for org ${orgId}`);

  await consolidatedAudit.logSystemAdmin(
    `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
    'system',
    'CLIENT',
    'PAYMENT_FAILED',
    {},
    {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      error: paymentIntent.last_payment_error?.message,
      source: 'webhook',
      orgId,
    }
  );

  // TODO: Notify customer of failed payment
}

/**
 * Handle charge.succeeded event
 */
async function handleChargeSucceeded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  console.log(`[stripe-connect] Charge succeeded: ${charge.id}`);
  // Additional charge-specific logic if needed
}

/**
 * Handle charge.failed event
 */
async function handleChargeFailed(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  console.log(`[stripe-connect] Charge failed: ${charge.id}`);
  // Additional charge-specific logic if needed
}

/**
 * Handle payout.paid event
 */
async function handlePayoutPaid(event: Stripe.Event) {
  const payout = event.data.object as Stripe.Payout;
  console.log(`[stripe-connect] Payout paid: ${payout.id} - ${payout.amount / 100} ${payout.currency.toUpperCase()}`);
  // TODO: Record payout in database
}

/**
 * Handle payout.failed event
 */
async function handlePayoutFailed(event: Stripe.Event) {
  const payout = event.data.object as Stripe.Payout;
  console.log(`[stripe-connect] Payout failed: ${payout.id}`);
  // TODO: Notify org of failed payout
}

// PR-CHECKS:
// - [x] POST /api/webhooks/stripe-connect implemented
// - [x] Signature verification
// - [x] Event idempotency (StripeEvent table)
// - [x] account.updated handler
// - [x] payment_intent.succeeded/failed handlers
// - [x] charge.succeeded/failed handlers
// - [x] payout.paid/failed handlers
// - [x] Audit logging


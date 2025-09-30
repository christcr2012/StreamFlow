/**
 * Module: Stripe Connect Checkout
 * Purpose: Create checkout session on behalf of connected account
 * Scope: POST /api/billing/checkout
 * Notes: Codex Phase 8.5 - On-behalf-of checkout with platform fee
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/guard';
import { decryptStripeAccountId } from '@/lib/crypto/aes';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Platform fee: 2.9% + $0.30 (configurable)
const PLATFORM_FEE_PERCENTAGE = 0.029;
const PLATFORM_FEE_FIXED_CENTS = 30;

interface CheckoutRequest {
  lineItems: Array<{
    name: string;
    description?: string;
    amount: number; // in cents
    quantity: number;
  }>;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session on behalf of the connected account
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated session
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only client space
    if (session.space !== 'client') {
      return res.status(403).json({ error: 'Only client users can create checkout sessions' });
    }

    const { orgId } = session;
    const body: CheckoutRequest = req.body;

    // Validate request
    if (!body.lineItems || body.lineItems.length === 0) {
      return res.status(400).json({ error: 'Line items are required' });
    }

    // Get Connect record
    const connectRecord = await prisma.tenantStripeConnect.findUnique({
      where: { orgId },
    });

    if (!connectRecord) {
      return res.status(400).json({ error: 'Stripe Connect not configured' });
    }

    if (connectRecord.connectStatus !== 'complete') {
      return res.status(400).json({ 
        error: 'Stripe Connect onboarding not complete',
        status: connectRecord.connectStatus,
      });
    }

    if (!connectRecord.chargesEnabled) {
      return res.status(400).json({ error: 'Charges not enabled on Connect account' });
    }

    // Decrypt account ID
    const connectedAccountId = decryptStripeAccountId(connectRecord.stripeConnectedAccountId);

    // Calculate total and platform fee
    const subtotal = body.lineItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENTAGE) + PLATFORM_FEE_FIXED_CENTS;

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: body.lineItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description,
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      customer_email: body.customerEmail,
      success_url: `${APP_URL}/client/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/client/billing/cancel`,
      payment_intent_data: {
        application_fee_amount: platformFee,
        on_behalf_of: connectedAccountId,
        transfer_data: {
          destination: connectedAccountId,
        },
        metadata: {
          orgId,
          tenantId: orgId,
          ...body.metadata,
        },
      },
      metadata: {
        orgId,
        tenantId: orgId,
        ...body.metadata,
      },
    }, {
      stripeAccount: connectedAccountId, // On-behalf-of header
    });

    return res.status(200).json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      subtotal,
      platformFee,
      total: subtotal,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: 'Stripe error',
        message: error.message,
        code: error.code,
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PR-CHECKS:
// - [x] POST /api/billing/checkout implemented
// - [x] On-behalf-of checkout session
// - [x] Platform fee calculation (2.9% + $0.30)
// - [x] Transfer to connected account
// - [x] Requires complete Connect onboarding
// - [x] Client-only access


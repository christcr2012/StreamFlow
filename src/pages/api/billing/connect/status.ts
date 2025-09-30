/**
 * Module: Stripe Connect Status
 * Purpose: Check Stripe Connect onboarding completion status
 * Scope: GET /api/billing/connect/status
 * Notes: Codex Phase 8.4 - Connect status check
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/guard';
import { decryptStripeAccountId } from '@/lib/crypto/aes';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * GET /api/billing/connect/status
 * Returns current Stripe Connect onboarding status
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
      return res.status(403).json({ error: 'Only client users can check Connect status' });
    }

    const { orgId } = session;

    // Get Connect record
    const connectRecord = await prisma.tenantStripeConnect.findUnique({
      where: { orgId },
    });

    if (!connectRecord) {
      return res.status(404).json({ 
        error: 'Stripe Connect not configured',
        configured: false,
      });
    }

    // Decrypt account ID
    const accountId = decryptStripeAccountId(connectRecord.stripeConnectedAccountId);

    // Fetch latest account status from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    // Update local record if status changed
    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;
    const detailsSubmitted = account.details_submitted || false;

    let connectStatus = 'pending';
    if (detailsSubmitted && chargesEnabled && payoutsEnabled) {
      connectStatus = 'complete';
    } else if (account.requirements?.disabled_reason) {
      connectStatus = 'restricted';
    }

    // Update database if changed
    if (
      connectRecord.chargesEnabled !== chargesEnabled ||
      connectRecord.payoutsEnabled !== payoutsEnabled ||
      connectRecord.connectStatus !== connectStatus
    ) {
      await prisma.tenantStripeConnect.update({
        where: { orgId },
        data: {
          chargesEnabled,
          payoutsEnabled,
          connectStatus,
        },
      });
    }

    return res.status(200).json({
      configured: true,
      accountId,
      connectStatus,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      requirements: {
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
        disabledReason: account.requirements?.disabled_reason || null,
      },
      capabilities: {
        cardPayments: account.capabilities?.card_payments || 'inactive',
        transfers: account.capabilities?.transfers || 'inactive',
      },
    });
  } catch (error) {
    console.error('Error checking Stripe Connect status:', error);
    
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
// - [x] GET /api/billing/connect/status implemented
// - [x] Retrieves account from Stripe
// - [x] Updates local status
// - [x] Returns requirements and capabilities
// - [x] Client-only access


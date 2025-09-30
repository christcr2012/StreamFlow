/**
 * Module: Stripe Connect Refresh
 * Purpose: Generate new onboarding link if incomplete
 * Scope: POST /api/billing/connect/refresh
 * Notes: Codex Phase 8.4 - Refresh onboarding link
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

/**
 * POST /api/billing/connect/refresh
 * Generates a new onboarding link for incomplete Connect accounts
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
      return res.status(403).json({ error: 'Only client users can refresh Connect link' });
    }

    // Only owners
    if (!session.isOwner) {
      return res.status(403).json({ error: 'Only organization owners can refresh Connect link' });
    }

    const { orgId } = session;

    // Get Connect record
    const connectRecord = await prisma.tenantStripeConnect.findUnique({
      where: { orgId },
    });

    if (!connectRecord) {
      return res.status(404).json({ error: 'Stripe Connect not configured' });
    }

    // Decrypt account ID
    const accountId = decryptStripeAccountId(connectRecord.stripeConnectedAccountId);

    // Check if already complete
    if (connectRecord.connectStatus === 'complete') {
      return res.status(400).json({ 
        error: 'Onboarding already complete',
        status: 'complete',
      });
    }

    // Create new account link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/client/billing/connect/refresh`,
      return_url: `${APP_URL}/client/billing/connect/complete`,
      type: 'account_onboarding',
    });

    return res.status(200).json({
      success: true,
      onboardingUrl: accountLink.url,
      expiresAt: accountLink.expires_at,
    });
  } catch (error) {
    console.error('Error refreshing Stripe Connect link:', error);
    
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
// - [x] POST /api/billing/connect/refresh implemented
// - [x] Generates new account link
// - [x] Owner-only access
// - [x] Prevents refresh if complete


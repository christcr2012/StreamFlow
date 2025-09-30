/**
 * Module: Stripe Connect Onboarding
 * Purpose: Create Stripe Connect account and return onboarding link
 * Scope: POST /api/billing/connect/onboard
 * Notes: Codex Phase 8.4 - Connect account creation
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/guard';
import { encryptStripeAccountId } from '@/lib/crypto/aes';
import { consolidatedAudit } from '@/lib/consolidated-audit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * POST /api/billing/connect/onboard
 * Creates a Stripe Connect account for the tenant and returns onboarding link
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

    // Only client space can onboard
    if (session.space !== 'client') {
      return res.status(403).json({ error: 'Only client users can onboard Stripe Connect' });
    }

    // Only owners can onboard
    if (!session.isOwner) {
      return res.status(403).json({ error: 'Only organization owners can onboard Stripe Connect' });
    }

    const { orgId } = session;

    // Check if already onboarded
    const existing = await prisma.tenantStripeConnect.findUnique({
      where: { orgId },
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'Stripe Connect already configured',
        status: existing.connectStatus,
      });
    }

    // Get org details for account creation
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        name: true,
      },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard', // Standard Connect for full control
      country: 'US',
      email: session.email,
      business_type: 'company',
      company: {
        name: org.name,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        orgId,
        tenantId: orgId,
        environment: process.env.NODE_ENV || 'development',
      },
    });

    // Encrypt account ID before storing
    const encryptedAccountId = encryptStripeAccountId(account.id);

    // Store in database
    await prisma.tenantStripeConnect.create({
      data: {
        orgId,
        stripeConnectedAccountId: encryptedAccountId,
        connectStatus: 'pending',
        chargesEnabled: false,
        payoutsEnabled: false,
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${APP_URL}/client/billing/connect/refresh`,
      return_url: `${APP_URL}/client/billing/connect/complete`,
      type: 'account_onboarding',
    });

    // Audit log
    await consolidatedAudit.logSystemAdmin(
      'Stripe Connect account created',
      session.email,
      'CLIENT',
      'STRIPE_CONNECT_ONBOARD',
      { ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress },
      {
        accountId: account.id,
        status: 'pending',
        userId: session.id,
      }
    );

    return res.status(200).json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      expiresAt: accountLink.expires_at,
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    
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
// - [x] POST /api/billing/connect/onboard implemented
// - [x] Creates Stripe Connect standard account
// - [x] Encrypts account ID before storage
// - [x] Returns onboarding link
// - [x] Owner-only access
// - [x] Audit logging


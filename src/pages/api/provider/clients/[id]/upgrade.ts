// Provider Client Upgrade API - Upgrade client subscription plans
// Referenced: javascript_stripe integration for subscription management

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
// Using middleware for auth - will work with existing session system
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe if keys are available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple auth check - Provider portal access
    // TODO: Add proper Provider role verification  
    const cookies = req.headers.cookie;
    if (!cookies?.includes('ws_user')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: clientId } = req.query;
    const { plan } = req.body;

    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    if (!['PRO', 'ELITE'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get the organization
    const org = await prisma.org.findUnique({
      where: { id: clientId }
    });

    if (!org) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update plan in database (for MVP, just update the plan field)
    await prisma.org.update({
      where: { id: clientId },
      data: {
        aiPlan: plan,
        // Add credits based on plan
        aiCreditBalance: {
          increment: plan === 'PRO' ? 4000 : 19000 // PRO gets +4k, ELITE gets +19k credits
        },
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date()
      }
    });

    // TODO: In future, integrate with Stripe for actual billing
    // if (stripe && org.stripeCustomerId) {
    //   // Create or update Stripe subscription
    // }

    res.status(200).json({
      success: true,
      message: `Client upgraded to ${plan} plan`
    });

  } catch (error) {
    console.error('Client upgrade API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upgrade client plan' 
    });
  }
}
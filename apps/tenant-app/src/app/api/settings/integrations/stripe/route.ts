import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Simple encryption for API keys (in production, use proper encryption library)
// For now, we'll store them as-is but mark them as sensitive
// TODO: Implement proper encryption using crypto library

const stripeConfigSchema = z.object({
  secretKey: z.string().min(1, 'Secret key is required').startsWith('sk_', 'Invalid Stripe secret key format'),
  publishableKey: z.string().min(1, 'Publishable key is required').startsWith('pk_', 'Invalid Stripe publishable key format'),
  webhookSecret: z.string().min(1, 'Webhook secret is required').startsWith('whsec_', 'Invalid webhook secret format'),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = stripeConfigSchema.parse(body);

    // Verify the org exists
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Test the Stripe configuration before saving
    const testResult = await testStripeConfiguration(validated.secretKey);
    
    if (!testResult.success) {
      return NextResponse.json(
        { error: `Stripe configuration test failed: ${testResult.error}` },
        { status: 400 }
      );
    }

    // Save the configuration
    // TODO: Encrypt the secret key and webhook secret before storing
    await prisma.org.update({
      where: { id: authContext.orgId },
      data: {
        stripeSecretKey: validated.secretKey, // TODO: Encrypt this
        stripePublishableKey: validated.publishableKey,
        stripeWebhookSecret: validated.webhookSecret, // TODO: Encrypt this
        stripeConfigured: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stripe configuration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save Stripe configuration' },
      { status: 500 }
    );
  }
}

// Test Stripe configuration by attempting to retrieve account info
async function testStripeConfiguration(secretKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Test Stripe API key by retrieving account information
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error?.message || 'Invalid Stripe API key' };
    }

    const account = await response.json();
    
    // Verify the account is active and can accept payments
    if (!account.charges_enabled) {
      return { success: false, error: 'Stripe account cannot accept charges. Please complete account setup.' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test Stripe configuration',
    };
  }
}


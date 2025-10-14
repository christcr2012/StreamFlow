/**
 * Stripe Payment Service - Tenant-Specific Payment Processing
 * 
 * This service processes payments using each tenant's own Stripe credentials
 * configured in their organization settings.
 * 
 * Each tenant must configure their own Stripe account in Settings → Integrations.
 */

import { prisma } from './prisma';
import { decrypt } from './encryption';

export interface CreatePaymentIntentOptions {
  amount: number; // Amount in cents
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
}

/**
 * Get decrypted Stripe configuration for a tenant
 */
export async function getStripeConfig(orgId: string): Promise<StripeConfig | null> {
  try {
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        stripeSecretKey: true,
        stripePublishableKey: true,
        stripeWebhookSecret: true,
        stripeConfigured: true,
      },
    });

    if (!org || !org.stripeConfigured || !org.stripeSecretKey) {
      return null;
    }

    return {
      secretKey: decrypt(org.stripeSecretKey),
      publishableKey: org.stripePublishableKey!,
      webhookSecret: decrypt(org.stripeWebhookSecret!),
    };
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return null;
  }
}

/**
 * Create a payment intent for an invoice
 */
export async function createPaymentIntent(
  orgId: string,
  options: CreatePaymentIntentOptions
): Promise<PaymentIntentResult> {
  try {
    const config = await getStripeConfig(orgId);

    if (!config) {
      return {
        success: false,
        error: 'Stripe not configured for this organization. Please configure in Settings → Integrations.',
      };
    }

    // Create payment intent using Stripe API
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: options.amount.toString(),
        currency: options.currency || 'usd',
        ...(options.description && { description: options.description }),
        ...(options.metadata && {
          'metadata[orgId]': orgId,
          ...Object.entries(options.metadata).reduce((acc, [key, value]) => {
            acc[`metadata[${key}]`] = value;
            return acc;
          }, {} as Record<string, string>),
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Stripe API error');
    }

    const paymentIntent = await response.json();

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    };
  }
}

/**
 * Retrieve a payment intent
 */
export async function retrievePaymentIntent(
  orgId: string,
  paymentIntentId: string
): Promise<any> {
  try {
    const config = await getStripeConfig(orgId);

    if (!config) {
      throw new Error('Stripe not configured');
    }

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Stripe API error');
    }

    return await response.json();
  } catch (error) {
    console.error('Stripe retrieve payment intent error:', error);
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 */
export async function verifyWebhookSignature(
  orgId: string,
  payload: string,
  signature: string
): Promise<boolean> {
  try {
    const config = await getStripeConfig(orgId);

    if (!config) {
      return false;
    }

    // Stripe webhook signature verification
    // This is a simplified version - in production, use the official Stripe SDK
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature.includes(expectedSignature);
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Process a successful payment
 * Updates invoice status and creates payment record
 */
export async function processSuccessfulPayment(
  orgId: string,
  paymentIntentId: string,
  invoiceId: string,
  amount: number
): Promise<void> {
  try {
    // Update invoice status to paid
    await prisma.invoice.update({
      where: { id: invoiceId, orgId },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orgId,
        invoiceId,
        amount,
        method: 'stripe',
        status: 'succeeded',
        stripePaymentIntentId: paymentIntentId,
        receivedAt: new Date(),
      },
    });

    console.log(`Payment processed successfully for invoice ${invoiceId}`);
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  orgId: string,
  paymentIntentId: string,
  amount?: number
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const config = await getStripeConfig(orgId);

    if (!config) {
      return {
        success: false,
        error: 'Stripe not configured',
      };
    }

    const body: Record<string, string> = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      body.amount = amount.toString();
    }

    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Stripe API error');
    }

    const refund = await response.json();

    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error) {
    console.error('Stripe refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process refund',
    };
  }
}

/**
 * Get Stripe publishable key for client-side use
 */
export async function getPublishableKey(orgId: string): Promise<string | null> {
  try {
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        stripePublishableKey: true,
        stripeConfigured: true,
      },
    });

    if (!org || !org.stripeConfigured) {
      return null;
    }

    return org.stripePublishableKey;
  } catch (error) {
    console.error('Error getting publishable key:', error);
    return null;
  }
}


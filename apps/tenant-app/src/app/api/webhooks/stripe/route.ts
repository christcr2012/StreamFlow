import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { decrypt } from '@/lib/encryption';
import { processSuccessfulPayment } from '@/lib/stripe-service';
import { sendEmail, getPaymentReceivedEmailTemplate } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';

// Ensure Node.js runtime for Stripe signature verification (requires crypto)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe Webhook Handler
 *
 * Handles webhook events from Stripe for payment processing.
 * Each tenant has their own Stripe account. We use the orgId in the payload
 * only as a hint to look up that tenant's webhook secret, and we do not trust
 * any fields until the signature is verified with that secret.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 1) Use the untrusted payload only to read orgId hint (do not act on it yet)
    let hintedOrgId: string | undefined;
    try {
      const unverified = JSON.parse(body);
      hintedOrgId = unverified?.data?.object?.metadata?.orgId;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!hintedOrgId) {
      console.warn('Webhook missing orgId in metadata');
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    // 2) Load tenant's webhook secret and verify signature
    const org = await prisma.org.findUnique({
      where: { id: hintedOrgId },
      select: { stripeWebhookSecret: true },
    });

    if (!org?.stripeWebhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured for org' }, { status: 400 });
    }

    const webhookSecret = decrypt(org.stripeWebhookSecret);
    const stripe = new Stripe('sk_test_dummy', { apiVersion: '2023-10-16' });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.warn('Invalid Stripe signature:', err?.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3) Re-derive orgId from the verified event and ensure consistency
    const orgId = (event.data as any)?.object?.metadata?.orgId as string | undefined;
    if (!orgId || orgId !== hintedOrgId) {
      return NextResponse.json({ error: 'orgId mismatch or missing after verification' }, { status: 400 });
    }

    // 4) Handle event types using the verified event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess((event.data as any).object, orgId);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure((event.data as any).object, orgId);
        break;

      case 'charge.refunded':
        await handleRefund((event.data as any).object, orgId);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: any, orgId: string) {
  try {
    const invoiceId = paymentIntent.metadata?.invoiceId;

    if (!invoiceId) {
      console.error('Payment intent missing invoiceId in metadata');
      return;
    }

    // Process the payment (update invoice, create payment record)
    await processSuccessfulPayment(
      orgId,
      paymentIntent.id,
      invoiceId,
      paymentIntent.amount
    );

    // Get invoice and customer details for email
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { Customer: true,
      },
    });

    if (!invoice || !invoice.Customer) {
      console.error('Invoice or customer not found');
      return;
    }

    // Send payment confirmation email to customer
    const customerEmail = invoice.Customer.primaryEmail;
    if (customerEmail) {
      const customerName = invoice.Customer.company || invoice.Customer.primaryName || 'Customer';
      const emailTemplate = getPaymentReceivedEmailTemplate({
        customerName,
        invoiceNumber: invoice.number || 'DRAFT',
        amount: paymentIntent.amount,
        paymentDate: new Date(),
      });

      await sendEmail(orgId, {
        to: customerEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    }

    console.log(`Payment processed successfully for invoice ${invoiceId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: any, orgId: string) {
  try {
    const invoiceId = paymentIntent.metadata?.invoiceId;

    if (!invoiceId) {
      console.error('Payment intent missing invoiceId in metadata');
      return;
    }

    // Update payment record to failed status
    const existingPayment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
        orgId,
      },
    });

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: 'failed',
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });
    } else {
      // Create failed payment record
      await prisma.payment.create({
        data: {
          orgId,
          invoiceId,
          amount: paymentIntent.amount,
          method: 'stripe',
          status: 'failed',
          stripePaymentIntentId: paymentIntent.id,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          retryCount: 1,
          lastRetryAt: new Date(),
        },
      });
    }

    console.log(`Payment failed for invoice ${invoiceId}: ${paymentIntent.last_payment_error?.message}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle refund
 */
async function handleRefund(charge: any, orgId: string) {
  try {
    const paymentIntentId = charge.payment_intent;

    if (!paymentIntentId) {
      console.error('Charge missing payment_intent');
      return;
    }

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        orgId,
      },
      include: { Invoice: true,
      },
    });

    if (!payment) {
      console.error('Payment not found for refund');
      return;
    }

    // Update payment status to refunded
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'refunded',
      },
    });

    // Update invoice status back to open if it was paid
    if (payment.Invoice && payment.Invoice.status === 'paid') {
      await prisma.invoice.update({
        where: { id: payment.Invoice.id },
        data: {
          status: 'open',
          paidAt: null,
        },
      });
    }

    console.log(`Refund processed for payment ${payment.id}`);
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}


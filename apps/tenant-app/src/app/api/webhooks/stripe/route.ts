import { NextRequest, NextResponse } from 'next/server';
import { processSuccessfulPayment } from '@/lib/stripe-service';
import { sendEmail, getPaymentReceivedEmailTemplate } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';

/**
 * Stripe Webhook Handler
 * 
 * Handles webhook events from Stripe for payment processing.
 * Each tenant has their own Stripe account, so we need to identify
 * which organization this webhook is for based on metadata.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Parse the event
    const event = JSON.parse(body);

    // Extract orgId from metadata
    const orgId = event.data?.object?.metadata?.orgId;

    if (!orgId) {
      console.error('Webhook missing orgId in metadata');
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object, orgId);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object, orgId);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object, orgId);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
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
      include: {
        customer: true,
      },
    });

    if (!invoice || !invoice.customer) {
      console.error('Invoice or customer not found');
      return;
    }

    // Send payment confirmation email to customer
    const customerEmail = invoice.customer.primaryEmail;
    if (customerEmail) {
      const customerName = invoice.customer.company || invoice.customer.primaryName || 'Customer';
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
      include: {
        invoice: true,
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
    if (payment.invoice && payment.invoice.status === 'paid') {
      await prisma.invoice.update({
        where: { id: payment.invoice.id },
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


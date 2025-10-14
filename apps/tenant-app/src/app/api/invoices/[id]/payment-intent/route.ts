import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { createPaymentIntent, getPublishableKey } from '@/lib/stripe-service';

/**
 * Create a Stripe payment intent for an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    const { id } = await params;

    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: {
        id,
        orgId: authContext.orgId,
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    // Check if Stripe is configured
    const publishableKey = await getPublishableKey(authContext.orgId);

    if (!publishableKey) {
      return NextResponse.json(
        { error: 'Stripe not configured. Please configure Stripe in Settings → Integrations.' },
        { status: 400 }
      );
    }

    // Create payment intent
    const customerName = invoice.customer?.company || invoice.customer?.primaryName || 'Customer';
    const result = await createPaymentIntent(authContext.orgId, {
      amount: Math.round(Number(invoice.amount) * 100), // Convert to cents
      currency: 'usd',
      description: `Invoice ${invoice.number || 'DRAFT'} - ${customerName}`,
      metadata: {
        invoiceId: invoice.id,
        orgId: authContext.orgId,
        customerId: invoice.customerId || '',
        invoiceNumber: invoice.number || 'DRAFT',
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      publishableKey,
      amount: Math.round(Number(invoice.amount) * 100),
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

/**
 * Get Stripe publishable key for the organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();

    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publishableKey = await getPublishableKey(authContext.orgId);

    if (!publishableKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 400 }
      );
    }

    return NextResponse.json({ publishableKey });
  } catch (error) {
    console.error('Error getting publishable key:', error);
    return NextResponse.json(
      { error: 'Failed to get publishable key' },
      { status: 500 }
    );
  }
}


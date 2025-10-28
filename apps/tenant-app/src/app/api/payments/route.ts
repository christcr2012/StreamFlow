// apps/tenant-app/src/app/api/payments/route.ts
// Payment processing API - Phase 2 (Prisma + Stripe methods)

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { getStripeConfig, refundPayment } from '@/lib/stripe-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    if (type === 'methods') {
      // List payment methods attached to the tenant's Stripe customer (org-level)
      const org = await prisma.org.findUnique({
        where: { id: auth.orgId },
        select: { stripeCustomerId: true },
      });

      const cfg = await getStripeConfig(auth.orgId);
      if (!cfg || !org?.stripeCustomerId) {
        return NextResponse.json({ paymentMethods: [], total: 0 });
      }

      const url = new URL('https://api.stripe.com/v1/payment_methods');
      url.searchParams.set('customer', org.stripeCustomerId);
      url.searchParams.set('type', 'card');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${cfg.secretKey}` },
      });
      if (!res.ok) {
        const e = await res.text();
        console.error('Stripe list payment methods error:', e);
        return NextResponse.json({ paymentMethods: [], total: 0 });
      }
      const json = await res.json();

      const methods = (json.data || []).map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        cardBrand: pm.card?.brand,
        cardLast4: pm.card?.last4,
        cardExpMonth: pm.card?.exp_month,
        cardExpYear: pm.card?.exp_year,
        isDefault: false,
        stripePaymentMethodId: pm.id,
        createdAt: new Date(pm.created * 1000).toISOString(),
      }));

      return NextResponse.json({ paymentMethods: methods, total: methods.length });
    }

    // Return payment transactions from DB
    const where: any = { orgId: auth.orgId };
    if (status && status !== 'all') where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        Invoice: { include: { Customer: true } },
      },
      orderBy: { receivedAt: 'desc' },
      take: 200,
    });

    const items = payments.map((p) => ({
      id: p.id,
      invoiceId: p.Invoice?.number || p.invoiceId || '',
      customerId: p.Invoice?.customerId || '',
      customerName: p.Invoice?.Customer?.company || p.Invoice?.Customer?.primaryName || 'Customer',
      amount: Number(p.amount),
      status: p.status,
      method: p.stripePaymentIntentId ? 'card' : (p.method || 'card'),
      stripePaymentIntentId: p.stripePaymentIntentId || '',
      createdAt: p.receivedAt.toISOString(),
      paidAt: p.status === 'succeeded' ? p.receivedAt.toISOString() : null,
    }));

    return NextResponse.json({ payments: items, total: items.length });
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body as { action?: string; paymentId?: string; paymentIntentId?: string; amount?: number };

    if (action === 'refund') {
      // Accept either a paymentId or a direct paymentIntentId
      let paymentIntentId = body.paymentIntentId as string | undefined;
      let paymentRecord: any | null = null;

      if (!paymentIntentId) {
        if (!body.paymentId) {
          return NextResponse.json({ error: 'paymentId or paymentIntentId required' }, { status: 400 });
        }
        paymentRecord = await prisma.payment.findFirst({
          where: { id: body.paymentId, orgId: auth.orgId },
          include: { Invoice: true },
        });
        if (!paymentRecord?.stripePaymentIntentId) {
          return NextResponse.json({ error: 'Payment not found or not a Stripe card payment' }, { status: 404 });
        }
        paymentIntentId = paymentRecord.stripePaymentIntentId;
      } else {
        // Load record if we have intent id to reflect status updates below
        paymentRecord = await prisma.payment.findFirst({
          where: { stripePaymentIntentId: paymentIntentId, orgId: auth.orgId },
          include: { Invoice: true },
        });
      }

      const result = await refundPayment(auth.orgId, paymentIntentId!, body.amount);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Refund failed' }, { status: 400 });
      }

      // Optimistically update DB; webhook will also reconcile
      if (paymentRecord) {
        await prisma.payment.update({ where: { id: paymentRecord.id }, data: { status: 'refunded' } });
        if (paymentRecord.Invoice && paymentRecord.Invoice.status === 'paid') {
          await prisma.invoice.update({ where: { id: paymentRecord.Invoice.id }, data: { status: 'open', paidAt: null } });
        }
      }

      return NextResponse.json({ success: true, refundId: result.refundId });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment action' },
      { status: 500 }
    );
  }
}

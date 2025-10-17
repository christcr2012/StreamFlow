import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PaymentPageClient from './payment-page-client';

export const metadata: Metadata = {
  title: 'Pay Invoice | Cortiware',
  description: 'Pay your invoice securely',
};

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Increment view count
  await prisma.invoice.updateMany({
    where: {
      paymentLinkToken: token,
      paymentLinkExpiresAt: { gte: new Date() },
    },
    data: {
      paymentLinkViews: { increment: 1 },
    },
  });

  const invoice = await prisma.invoice.findFirst({
    where: {
      paymentLinkToken: token,
      paymentLinkExpiresAt: { gte: new Date() },
    },
    include: { Customer: {
        select: {
          company: true,
          primaryName: true,
          primaryEmail: true,
        },
      },
      Org: {
        select: {
          name: true,
          stripePublishableKey: true,
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  return (
    <PaymentPageClient
      invoice={{
        id: invoice.id,
        number: invoice.number,
        amount: Number(invoice.amount),
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.dueDate?.toISOString() || null,
        issuedAt: invoice.issuedAt.toISOString(),
        terms: invoice.terms,
        notes: invoice.notes,
        customer: invoice.Customer || { company: null, primaryName: null, primaryEmail: null },
        orgName: invoice.Org.name,
      }}
      stripePublishableKey={invoice.Org.stripePublishableKey || ''}
    />
  );
}


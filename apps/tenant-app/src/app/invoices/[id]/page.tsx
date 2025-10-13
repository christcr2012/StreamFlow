import { getAuthContext } from '@/lib/auth-context';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailClient } from './invoice-detail-client';

async function getInvoice(id: string, orgId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      orgId,
    },
    include: {
      lineItems: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  // Fetch related data separately
  const [customer, job, payments] = await Promise.all([
    invoice.customerId
      ? prisma.customer.findUnique({
          where: { id: invoice.customerId },
          select: {
            id: true,
            company: true,
            primaryName: true,
            primaryEmail: true,
            primaryPhone: true,
          },
        })
      : null,
    invoice.jobId
      ? prisma.job.findUnique({
          where: { id: invoice.jobId },
          select: {
            id: true,
            title: true,
          },
        })
      : null,
    prisma.payment.findMany({
      where: { invoiceId: invoice.id },
      orderBy: { receivedAt: 'desc' },
    }),
  ]);

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    discountAmount: Number(invoice.discountAmount),
    amount: Number(invoice.amount),
    customer,
    job,
    payments: payments.map(p => ({
      ...p,
      amount: Number(p.amount),
    })),
  };
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  const { id } = await params;
  const invoice = await getInvoice(id, authContext.orgId);

  return <InvoiceDetailClient invoice={invoice} />;
}


import { getAuthContext } from '@/lib/auth-context';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailClient } from './invoice-detail-client';

async function getInvoice(id: string, orgId: string) {
  // PERFORMANCE OPTIMIZATION: Use include for related data to reduce queries from 5 to 2
  // (Invoice with relations + Job lookup if needed)
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      orgId,
    },
    include: {
      lineItems: {
        orderBy: { createdAt: 'asc' },
      },
      customer: {
        select: {
          id: true,
          company: true,
          primaryName: true,
          primaryEmail: true,
          primaryPhone: true,
        },
      },
      payments: {
        orderBy: { receivedAt: 'desc' },
      },
      reminders: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  // Fetch job separately (no relation defined in schema)
  const job = invoice.jobId
    ? await prisma.job.findUnique({
        where: { id: invoice.jobId },
        select: {
          id: true,
          title: true,
        },
      })
    : null;

  // Convert Decimal types to numbers for client components
  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    discountAmount: Number(invoice.discountAmount),
    amount: Number(invoice.amount),
    job,
    payments: invoice.payments.map(p => ({
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


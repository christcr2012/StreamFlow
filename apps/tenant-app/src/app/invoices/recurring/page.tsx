import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import RecurringInvoicesClient from './recurring-invoices-client';

export const metadata: Metadata = {
  title: 'Recurring Invoices | Cortiware',
  description: 'Manage recurring invoices',
};

export default async function RecurringInvoicesPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  const recurringInvoices = await prisma.recurringInvoice.findMany({
    where: { orgId: authContext.orgId },
    include: { Customer: {
        select: {
          id: true,
          company: true,
          primaryName: true,
          primaryEmail: true,
        },
      },
    },
    orderBy: { nextInvoiceDate: 'asc' },
  });

  const customers = await prisma.customer.findMany({
    where: { orgId: authContext.orgId },
    select: {
      id: true,
      company: true,
      primaryName: true,
      primaryEmail: true,
    },
    orderBy: { company: 'asc' },
  });

  return (
    <RecurringInvoicesClient
      recurringInvoices={recurringInvoices.map((ri: any) => ({
        ...ri,
        startDate: ri.startDate.toISOString(),
        endDate: ri.endDate?.toISOString() || null,
        nextInvoiceDate: ri.nextInvoiceDate.toISOString(),
        createdAt: ri.createdAt.toISOString(),
        updatedAt: ri.updatedAt.toISOString(),
      }))}
      customers={customers}
    />
  );
}


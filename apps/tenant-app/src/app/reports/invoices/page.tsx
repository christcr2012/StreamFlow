import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import InvoiceAgingClient from './invoice-aging-client';

export const metadata: Metadata = {
  title: 'Invoice Aging Report | Cortiware',
  description: 'Track overdue invoices by aging buckets',
};

export default async function InvoiceAgingPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  return <InvoiceAgingClient />;
}


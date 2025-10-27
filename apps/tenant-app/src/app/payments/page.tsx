// apps/tenant-app/src/app/payments/page.tsx
// Payment processing page wrapper

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { PaymentsClient } from './payments-client';

export const metadata: Metadata = {
  title: 'Payments | Cortiware',
  description: 'Manage payment processing and methods',
};

export default async function PaymentsPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return <PaymentsClient orgId={authContext.orgId} />;
}

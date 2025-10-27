// apps/tenant-app/src/app/recurring-services/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { RecurringServicesClient } from './recurring-services-client';

export const metadata: Metadata = {
  title: 'Recurring Services | Cortiware',
  description: 'Manage recurring service contracts',
};

export default async function RecurringServicesPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }
  return <RecurringServicesClient orgId={authContext.orgId} />;
}

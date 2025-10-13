import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { NewCustomerClient } from './new-customer-client';

export default async function NewCustomerPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return <NewCustomerClient />;
}


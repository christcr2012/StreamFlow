import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import CustomerInsightsClient from './customer-insights-client';

export const metadata: Metadata = {
  title: 'Customer Insights | Cortiware',
  description: 'Top customers by revenue',
};

export default async function CustomerInsightsPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  return <CustomerInsightsClient />;
}


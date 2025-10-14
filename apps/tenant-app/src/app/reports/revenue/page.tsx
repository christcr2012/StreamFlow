import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import RevenueReportClient from './revenue-report-client';

export const metadata: Metadata = {
  title: 'Revenue Trends | Cortiware',
  description: 'Track revenue over time',
};

export default async function RevenueReportPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  return <RevenueReportClient />;
}


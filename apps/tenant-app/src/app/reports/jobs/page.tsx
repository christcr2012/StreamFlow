import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import JobMetricsClient from './job-metrics-client';

export const metadata: Metadata = {
  title: 'Job Completion Metrics | Cortiware',
  description: 'Job completion rates and metrics',
};

export default async function JobMetricsPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  return <JobMetricsClient />;
}


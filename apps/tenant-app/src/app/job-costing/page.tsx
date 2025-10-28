// apps/tenant-app/src/app/job-costing/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { JobCostingClient } from './job-costing-client';

export const metadata: Metadata = {
  title: 'Job Costing | Cortiware',
  description: 'Track job costs and profitability',
};

export default async function JobCostingPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }
  return <JobCostingClient orgId={authContext.orgId} />;
}

// apps/tenant-app/src/app/time-tracking/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { TimeTrackingClient } from './time-tracking-client';

export const metadata: Metadata = {
  title: 'Time Tracking | Cortiware',
  description: 'Manage time tracking and payroll',
};

export default async function TimeTrackingPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }
  return <TimeTrackingClient orgId={authContext.orgId} />;
}

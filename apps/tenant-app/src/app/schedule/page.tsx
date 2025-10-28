// apps/tenant-app/src/app/schedule/page.tsx
// Scheduling & Dispatch - Phase 1 scaffold
// Issue #165: Scheduling & Dispatch system

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { ScheduleClient } from './schedule-client';

export const metadata: Metadata = {
  title: 'Schedule & Dispatch | Cortiware',
  description: 'Manage job scheduling and technician assignments',
};

export default async function SchedulePage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return (
    <div className="h-screen flex flex-col">
      <ScheduleClient orgId={authContext.orgId} />
    </div>
  );
}

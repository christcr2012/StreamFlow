// apps/tenant-app/src/app/notifications/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { NotificationsClient } from './notifications-client';

export const metadata: Metadata = {
  title: 'Notifications | Cortiware',
  description: 'View and manage notifications',
};

export default async function NotificationsPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }
  return <NotificationsClient orgId={authContext.orgId} />;
}

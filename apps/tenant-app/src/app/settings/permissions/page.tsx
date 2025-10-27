// apps/tenant-app/src/app/settings/permissions/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { PermissionsClient } from './permissions-client';

export const metadata: Metadata = {
  title: 'Roles & Permissions | Cortiware',
  description: 'Manage user roles and permissions',
};

export default async function PermissionsPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }
  return <PermissionsClient orgId={authContext.orgId} />;
}

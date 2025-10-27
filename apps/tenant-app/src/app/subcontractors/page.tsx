// apps/tenant-app/src/app/subcontractors/page.tsx
// Subcontractor management page wrapper

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { SubcontractorsClient } from './subcontractors-client';

export const metadata: Metadata = {
  title: 'Subcontractors | Cortiware',
  description: 'Manage subcontractor directory and assignments',
};

export default async function SubcontractorsPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return <SubcontractorsClient orgId={authContext.orgId} />;
}

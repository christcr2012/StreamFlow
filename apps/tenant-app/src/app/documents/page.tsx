// apps/tenant-app/src/app/documents/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { DocumentsClient } from './documents-client';

export const metadata: Metadata = {
  title: 'Documents | Cortiware',
  description: 'Manage documents and files',
};

export default async function DocumentsPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }
  return <DocumentsClient orgId={authContext.orgId} />;
}

// apps/tenant-app/src/app/settings/vertical-pack/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { VerticalPackClient } from './vertical-pack-client';

export const metadata: Metadata = {
  title: 'Industry Configuration | Cortiware',
  description: 'Configure industry-specific features',
};

export default async function VerticalPackPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }
  return <VerticalPackClient orgId={authContext.orgId} />;
}

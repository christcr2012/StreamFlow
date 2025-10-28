// apps/tenant-app/src/app/settings/features/page.tsx
// Feature flags management page wrapper

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { FeaturesClient } from './features-client';

export const metadata: Metadata = {
  title: 'Feature Flags | Cortiware',
  description: 'Manage feature toggles and A/B testing',
};

export default async function FeaturesPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return <FeaturesClient orgId={authContext.orgId} />;
}

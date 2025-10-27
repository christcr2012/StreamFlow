// apps/tenant-app/src/app/estimates/page.tsx
// Estimates & Quotes - Phase 1 scaffold

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { EstimatesClient } from './estimates-client';

export const metadata: Metadata = {
  title: 'Estimates & Quotes | Cortiware',
  description: 'Create and manage customer estimates',
};

export default async function EstimatesPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return <EstimatesClient orgId={authContext.orgId} />;
}

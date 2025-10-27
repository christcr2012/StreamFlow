// apps/tenant-app/src/app/estimates/new/page.tsx
// New Estimate placeholder - Phase 1 stub

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'New Estimate | Cortiware',
};

export default async function NewEstimatePage() {
  const auth = await getAuthContext();
  if (!auth.isAuthenticated || !auth.orgId) {
    redirect('/login');
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900">Create Estimate</h1>
      <p className="mt-2 text-gray-600">
        Phase 1 stub: The estimate creation form will be implemented in Phase 2 with validation and save-as-draft.
      </p>
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        This page is a placeholder to prevent broken navigation. No actions are available yet.
      </div>
    </div>
  );
}

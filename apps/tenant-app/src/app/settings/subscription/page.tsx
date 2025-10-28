// apps/tenant-app/src/app/settings/subscription/page.tsx
// Subscription & Tier Management - Phase 1 scaffold

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { SubscriptionClient } from './subscription-client';

export const metadata: Metadata = {
  title: 'Subscription & Billing | Cortiware',
  description: 'Manage your subscription tier and billing',
};

export default async function SubscriptionPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Subscription & Billing
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your current plan, usage limits, and manage your subscription
        </p>
      </div>

      <SubscriptionClient orgId={authContext.orgId} />
    </div>
  );
}

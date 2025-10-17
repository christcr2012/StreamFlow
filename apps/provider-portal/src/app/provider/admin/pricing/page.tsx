/**
 * Marketing Pricing Management Page
 * 
 * Allows super admins to manage pricing plans for the Cortiware marketing site
 * Features:
 * - View all pricing plans with status badges
 * - Create/edit/delete plans
 * - Draft → Review → Publish workflow
 * - Pricing history tracking
 */

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import PricingPlansList from './PricingPlansList';
import { Button } from '@cortiware/ui';
import Link from 'next/link';

async function checkSuperAdminAccess() {
  const cookieStore = await cookies();
  const hasProviderSession = cookieStore.get('rs_provider') || cookieStore.get('provider-session') || cookieStore.get('ws_provider');
  
  if (!hasProviderSession) {
    redirect('/login');
  }
  
  // TODO: Add actual super admin role check when user/role system is implemented
  // For now, allow access if authenticated as provider
  return true;
}

export default async function PricingManagementPage() {
  await checkSuperAdminAccess();
  
  // Fetch all pricing plans with features and history
  const plans = await prisma.marketingPricingPlan.findMany({
    include: {
      features: {
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: { history: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Marketing Pricing Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage pricing plans for the Cortiware marketing website
          </p>
        </div>
        <Link href="/provider/admin/pricing/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            + Create New Plan
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              How Pricing Updates Work
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Changes to pricing plans follow a <strong>Draft → Review → Publish</strong> workflow. 
              Only <strong>PUBLISHED</strong> plans appear on the marketing site. 
              The site automatically updates within <strong>60 seconds</strong> of publishing (no deployment needed).
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Plans List */}
      <PricingPlansList plans={plans} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Plans</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {plans.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Published</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {plans.filter(p => p.status === 'PUBLISHED').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {plans.filter(p => p.status === 'PENDING_REVIEW').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Drafts</div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
            {plans.filter(p => p.status === 'DRAFT').length}
          </div>
        </div>
      </div>
    </div>
  );
}


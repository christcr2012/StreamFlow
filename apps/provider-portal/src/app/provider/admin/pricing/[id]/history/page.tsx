/**
 * Pricing Plan History Page
 * 
 * Shows the complete history of changes to a pricing plan
 */

import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@cortiware/ui';

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

export default async function PricingPlanHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkSuperAdminAccess();
  
  const { id } = await params;

  // Fetch the plan with full history
  const plan = await prisma.marketingPricingPlan.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pricing History: {plan.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete change history for this pricing plan
          </p>
        </div>
        <Link href="/provider/admin/pricing">
          <Button variant="outline">
            ← Back to Pricing
          </Button>
        </Link>
      </div>

      {/* Current Plan Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Name</div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">{plan.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Price</div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {plan.price ? `$${(plan.price / 100).toFixed(2)}` : 'Custom'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
            <div className="text-lg font-medium">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                plan.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                plan.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {plan.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change History</h2>

        {plan.history.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No history records yet
          </p>
        ) : (
          <div className="space-y-6">
            {plan.history.map((record, index) => (
              <div key={record.id} className="relative">
                {/* Timeline line */}
                {index < plan.history.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                )}

                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center relative z-10">
                    <div className="w-3 h-3 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {record.action}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(record.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      {record.changedBy && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          by {record.changedBy}
                        </div>
                      )}
                    </div>

                    {/* Changes */}
                    {record.changes && typeof record.changes === 'object' && (
                      <div className="mt-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Changes:
                        </div>
                        <div className="space-y-1 text-sm">
                          {Object.entries(record.changes as Record<string, any>).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-gray-600 dark:text-gray-400 font-mono">{key}:</span>
                              <span className="text-gray-900 dark:text-white">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reason */}
                    {record.reason && (
                      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 italic">
                        Reason: &quot;{record.reason}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Changes</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {plan.history.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
          <div className="text-lg font-medium text-gray-900 dark:text-white mt-1">
            {new Date(plan.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Last Updated</div>
          <div className="text-lg font-medium text-gray-900 dark:text-white mt-1">
            {new Date(plan.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}


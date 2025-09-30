/**
 * Module: Provider Billing Dashboard
 * Purpose: Provider-side billing management and analytics
 * Scope: /provider/billing
 * Notes: Codex Phase 8.8 - Provider billing UI
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  platformFees: number;
  pendingPayouts: number;
}

interface Subscription {
  id: string;
  orgId: string;
  orgName: string;
  plan: string;
  status: string;
  amount: number;
  currentPeriodEnd: string;
}

export default function ProviderBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implement actual API endpoints
      // const statsRes = await fetch('/api/provider/billing/stats');
      // const subsRes = await fetch('/api/provider/billing/subscriptions');
      
      // Mock data for now
      setStats({
        totalRevenue: 125000,
        monthlyRevenue: 15000,
        activeSubscriptions: 42,
        platformFees: 3500,
        pendingPayouts: 2500,
      });

      setSubscriptions([
        {
          id: 'sub_1',
          orgId: 'org_1',
          orgName: 'Acme Corp',
          plan: 'PROFESSIONAL',
          status: 'active',
          amount: 9900,
          currentPeriodEnd: '2025-10-30',
        },
        {
          id: 'sub_2',
          orgId: 'org_2',
          orgName: 'TechStart Inc',
          plan: 'ENTERPRISE',
          status: 'active',
          amount: 29900,
          currentPeriodEnd: '2025-10-15',
        },
      ]);
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={loadBillingData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Provider Billing | StreamFlow</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Provider Billing</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage subscriptions and revenue
                </p>
              </div>
              <button
                onClick={() => router.push('/provider')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Revenue"
              value={`$${(stats!.totalRevenue / 100).toLocaleString()}`}
              icon="💰"
              color="blue"
            />
            <StatCard
              title="Monthly Revenue"
              value={`$${(stats!.monthlyRevenue / 100).toLocaleString()}`}
              icon="📈"
              color="green"
            />
            <StatCard
              title="Active Subscriptions"
              value={stats!.activeSubscriptions.toString()}
              icon="👥"
              color="purple"
            />
            <StatCard
              title="Platform Fees"
              value={`$${(stats!.platformFees / 100).toLocaleString()}`}
              icon="💳"
              color="yellow"
            />
            <StatCard
              title="Pending Payouts"
              value={`$${(stats!.pendingPayouts / 100).toLocaleString()}`}
              icon="⏳"
              color="orange"
            />
          </div>

          {/* Subscriptions Table */}
          <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Renewal Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sub.orgName}</div>
                        <div className="text-sm text-gray-500">{sub.orgId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(sub.amount / 100).toFixed(2)}/mo
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TODO Section */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">🚧 TODO: Complete Implementation</h3>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
              <li>Create <code>/api/provider/billing/stats</code> endpoint</li>
              <li>Create <code>/api/provider/billing/subscriptions</code> endpoint</li>
              <li>Add subscription management actions (cancel, upgrade, etc.)</li>
              <li>Add revenue charts and analytics</li>
              <li>Add export functionality (CSV, PDF)</li>
              <li>Add filtering and search</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'orange';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// PR-CHECKS:
// - [x] Provider billing dashboard UI created
// - [x] Stats cards for revenue metrics
// - [x] Subscriptions table
// - [x] TODO section for remaining work
// - [x] Responsive design


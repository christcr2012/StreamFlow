// Provider Portal - Management dashboard for Provider to control client subscriptions and billing
// Referenced: javascript_stripe integration for subscription management

import { useState, useEffect } from 'react';
import { useMe } from '@/lib/useMe';
import AppShell from '@/components/AppShell';

interface ClientSubscription {
  id: string;
  name: string;
  email: string;
  plan: 'BASE' | 'PRO' | 'ELITE';
  status: string;
  creditsRemaining: number;
  monthlyUsage: number;
  conversionCount: number;
  revenue: number;
  subscriptionStartDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface ProviderStats {
  totalClients: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  conversionRevenue: number;
  totalProviderCosts: number;
  profitMargin: number;
}

export default function ProviderPortal() {
  const [clients, setClients] = useState<ClientSubscription[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const { me } = useMe();

  useEffect(() => {
    fetchProviderData();
  }, []);

  async function fetchProviderData() {
    try {
      const [clientsRes, statsRes] = await Promise.all([
        fetch('/api/provider/clients'),
        fetch('/api/provider/stats')
      ]);

      const clientsData = await clientsRes.json();
      const statsData = await statsRes.json();

      if (clientsData.success) setClients(clientsData.clients);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to fetch provider data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function upgradePlan(clientId: string, newPlan: 'PRO' | 'ELITE') {
    try {
      const response = await fetch(`/api/provider/clients/${clientId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      });

      if (response.ok) {
        await fetchProviderData();
      }
    } catch (error) {
      console.error('Failed to upgrade plan:', error);
    }
  }

  async function addCredits(clientId: string, credits: number) {
    try {
      const response = await fetch(`/api/provider/clients/${clientId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits })
      });

      if (response.ok) {
        await fetchProviderData();
      }
    } catch (error) {
      console.error('Failed to add credits:', error);
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'ELITE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PRO': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Provider Portal</h1>
          <p className="text-gray-600 mt-2">Manage client subscriptions, billing, and system controls</p>
        </div>

        {/* Provider Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-gray-900">{stats.totalClients}</div>
              <div className="text-sm text-gray-600">Total Clients</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-green-600">${stats.monthlyRecurringRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-blue-600">${stats.conversionRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Conversion Revenue</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.profitMargin}%</div>
              <div className="text-sm text-gray-600">Profit Margin</div>
              <div className="text-xs text-gray-500 mt-1">
                Costs: ${stats.totalProviderCosts}
              </div>
            </div>
          </div>
        )}

        {/* Client Management Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Client Subscriptions</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPlanColor(client.plan)}`}>
                        {client.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.creditsRemaining.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.conversionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${client.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {client.plan === 'BASE' && (
                        <button
                          onClick={() => upgradePlan(client.id, 'PRO')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Upgrade to PRO
                        </button>
                      )}
                      {client.plan === 'PRO' && (
                        <button
                          onClick={() => upgradePlan(client.id, 'ELITE')}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          Upgrade to ELITE
                        </button>
                      )}
                      <button
                        onClick={() => addCredits(client.id, 1000)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Add Credits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription Tier Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BASE Tier */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">BASE</h3>
              <div className="text-2xl font-bold text-gray-900 mb-1">FREE</div>
              <div className="text-sm text-gray-600 mb-4">MVP Phase</div>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>• Free lead generation</li>
                <li>• $100 per conversion only</li>
                <li>• Basic AI features</li>
                <li>• 1,000 credits included</li>
                <li>• Email support</li>
              </ul>
            </div>
          </div>

          {/* PRO Tier */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">PRO</h3>
              <div className="text-2xl font-bold text-blue-900 mb-1">$97/month</div>
              <div className="text-sm text-blue-600 mb-4">+ $100 per conversion</div>
              <ul className="text-sm text-blue-700 space-y-2 text-left">
                <li>• Advanced AI insights</li>
                <li>• Unlimited lead generation</li>
                <li>• Priority support</li>
                <li>• 5,000 credits/month</li>
                <li>• Custom reporting</li>
              </ul>
            </div>
          </div>

          {/* ELITE Tier */}
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">ELITE</h3>
              <div className="text-2xl font-bold text-purple-900 mb-1">$297/month</div>
              <div className="text-sm text-purple-600 mb-4">+ $100 per conversion</div>
              <ul className="text-sm text-purple-700 space-y-2 text-left">
                <li>• Market intelligence & competitor tracking</li>
                <li>• Priority access to high-value RFPs</li>
                <li>• Advanced territory analysis</li>
                <li>• 20,000 credits/month</li>
                <li>• Dedicated account manager</li>
                <li>• Custom CRM integrations</li>
                <li>• Direct phone support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
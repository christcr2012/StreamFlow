// src/pages/provider/monetization.tsx

/**
 * 💰 MONETIZATION CONSOLE - Provider Tools
 * 
 * Custom pricing management and revenue optimization
 */

import React, { useState, useEffect } from 'react';
import ProviderLayout from '@/components/ProviderLayout';

interface ClientPricing {
  id: string;
  clientName: string;
  orgId: string;
  plan: string;
  monthlyFee: number;
  leadPrice: number;
  aiCreditsIncluded: number;
  status: 'active' | 'pending' | 'suspended';
  customRules?: {
    volumeDiscounts?: boolean;
    prioritySupport?: boolean;
    customFeatures?: string[];
  };
}

interface RevenueStats {
  totalMonthlyRevenue: number;
  totalClients: number;
  averageRevenuePerClient: number;
  leadRevenue: number;
  subscriptionRevenue: number;
  growthRate: number;
}

export default function MonetizationConsole() {
  const [activeTab, setActiveTab] = useState('pricing');
  const [clientPricing, setClientPricing] = useState<ClientPricing[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadMonetizationData();
  }, []);

  const loadMonetizationData = async () => {
    try {
      setLoading(true);

      // Mock data for now - in production, this would come from API
      const mockClientPricing: ClientPricing[] = [
        {
          id: '1',
          clientName: 'Mountain Vista Construction',
          orgId: 'org_1',
          plan: 'Enterprise Custom',
          monthlyFee: 2500,
          leadPrice: 15,
          aiCreditsIncluded: 100000,
          status: 'active',
          customRules: {
            volumeDiscounts: true,
            prioritySupport: true,
            customFeatures: ['Advanced AI', 'Custom Integrations', 'Dedicated Support']
          }
        },
        {
          id: '2',
          clientName: 'Apex Roofing Solutions',
          orgId: 'org_2',
          plan: 'Professional Plus',
          monthlyFee: 1200,
          leadPrice: 12,
          aiCreditsIncluded: 50000,
          status: 'active',
          customRules: {
            volumeDiscounts: false,
            prioritySupport: true,
            customFeatures: ['Standard AI', 'Email Support']
          }
        },
        {
          id: '3',
          clientName: 'Elite Home Services',
          orgId: 'org_3',
          plan: 'Starter Custom',
          monthlyFee: 800,
          leadPrice: 18,
          aiCreditsIncluded: 25000,
          status: 'pending',
          customRules: {
            volumeDiscounts: false,
            prioritySupport: false,
            customFeatures: ['Basic AI', 'Standard Support']
          }
        }
      ];

      const mockRevenueStats: RevenueStats = {
        totalMonthlyRevenue: 4500,
        totalClients: 3,
        averageRevenuePerClient: 1500,
        leadRevenue: 2800,
        subscriptionRevenue: 1700,
        growthRate: 15.2
      };

      setClientPricing(mockClientPricing);
      setRevenueStats(mockRevenueStats);
    } catch (error) {
      console.error('Failed to load monetization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'pricing', name: 'Custom Pricing', icon: '💰' },
    { id: 'analytics', name: 'Revenue Analytics', icon: '📊' },
    { id: 'packages', name: 'Package Builder', icon: '📦' },
    { id: 'billing', name: 'Billing Rules', icon: '📋' },
  ];

  return (
    <ProviderLayout title="Monetization Console">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Monetization Console</h2>
          <p className="text-slate-600">Manage custom pricing and revenue optimization for all clients</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[500px]">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading monetization data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'pricing' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Custom Client Pricing</h3>
                    <p className="text-slate-600">Set individual pricing agreements for each client</p>
                  </div>

                  {/* Revenue Summary Cards */}
                  {revenueStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-900">
                          ${revenueStats.totalMonthlyRevenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-700">Monthly Revenue</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-900">
                          {revenueStats.totalClients}
                        </div>
                        <div className="text-sm text-green-700">Active Clients</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-900">
                          ${revenueStats.averageRevenuePerClient.toLocaleString()}
                        </div>
                        <div className="text-sm text-purple-700">Avg Revenue/Client</div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-orange-900">
                          +{revenueStats.growthRate}%
                        </div>
                        <div className="text-sm text-orange-700">Growth Rate</div>
                      </div>
                    </div>
                  )}

                  {/* Client Pricing List */}
                  <div className="space-y-4">
                    {clientPricing.map((client) => (
                      <div key={client.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-6">
                              <div>
                                <h4 className="font-semibold text-slate-900">{client.clientName}</h4>
                                <p className="text-sm text-slate-600">{client.plan}</p>
                              </div>
                              <div className="text-sm">
                                <span className="text-slate-600">Monthly: </span>
                                <span className="font-medium text-slate-900">${client.monthlyFee.toLocaleString()}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-slate-600">Per Lead: </span>
                                <span className="font-medium text-slate-900">${client.leadPrice}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-slate-600">AI Credits: </span>
                                <span className="font-medium text-slate-900">{(client.aiCreditsIncluded / 1000).toFixed(0)}K</span>
                              </div>
                            </div>
                            {client.customRules?.customFeatures && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {client.customRules.customFeatures.map((feature, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              client.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : client.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                            </span>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Edit Pricing
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Pricing */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      + Add Custom Pricing Agreement
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

              {activeTab === 'analytics' && revenueStats && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Revenue Analytics</h3>
                    <p className="text-slate-600">Track performance and optimize pricing strategies</p>
                  </div>

                  {/* Revenue Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Revenue Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Subscription Revenue</span>
                          <span className="font-medium">${revenueStats.subscriptionRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Lead Revenue</span>
                          <span className="font-medium">${revenueStats.leadRevenue.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Total Monthly Revenue</span>
                            <span>${revenueStats.totalMonthlyRevenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Active Clients</span>
                          <span className="font-medium">{revenueStats.totalClients}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Avg Revenue/Client</span>
                          <span className="font-medium">${revenueStats.averageRevenuePerClient.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Growth Rate</span>
                          <span className="font-medium text-green-600">+{revenueStats.growthRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Performance Table */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">Client Performance</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 font-medium text-slate-700">Client</th>
                            <th className="text-left py-2 font-medium text-slate-700">Monthly Fee</th>
                            <th className="text-left py-2 font-medium text-slate-700">Lead Revenue</th>
                            <th className="text-left py-2 font-medium text-slate-700">Total Revenue</th>
                            <th className="text-left py-2 font-medium text-slate-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientPricing.map((client) => (
                            <tr key={client.id} className="border-b border-slate-100">
                              <td className="py-2 font-medium">{client.clientName}</td>
                              <td className="py-2">${client.monthlyFee.toLocaleString()}</td>
                              <td className="py-2">${(client.leadPrice * 50).toLocaleString()}</td>
                              <td className="py-2 font-medium">${(client.monthlyFee + (client.leadPrice * 50)).toLocaleString()}</td>
                              <td className="py-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  client.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'packages' || activeTab === 'billing') && (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-4">🚧</div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {tabs.find(t => t.id === activeTab)?.name} Tools
                  </h3>
                  <p className="text-slate-600">Advanced monetization tools coming soon...</p>
                </div>
              )}
        </div>
      </div>
    </ProviderLayout>
  );
}

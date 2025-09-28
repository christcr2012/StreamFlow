// src/pages/provider/monetization.tsx

/**
 * 💰 MONETIZATION CONSOLE - Provider Tools
 * 
 * Custom pricing management and revenue optimization
 */

import React, { useState } from 'react';
import ProviderLayout from '@/components/ProviderLayout';

export default function MonetizationConsole() {
  const [activeTab, setActiveTab] = useState('pricing');

  const tabs = [
    { id: 'pricing', name: 'Custom Pricing', icon: '💰' },
    { id: 'packages', name: 'Packages', icon: '📦' },
    { id: 'billing', name: 'Billing Rules', icon: '📋' },
    { id: 'analytics', name: 'Revenue Analytics', icon: '📊' },
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
          {activeTab === 'pricing' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Custom Client Pricing</h3>
                <p className="text-slate-600">Set individual pricing agreements for each client</p>
              </div>

              {/* Client Pricing List */}
              <div className="space-y-4">
                {[
                  { 
                    client: 'Mountain Vista Construction', 
                    plan: 'Enterprise Custom', 
                    monthly: '$2,500', 
                    leads: '$15/lead',
                    status: 'Active'
                  },
                  { 
                    client: 'Apex Roofing Solutions', 
                    plan: 'Professional Plus', 
                    monthly: '$1,200', 
                    leads: '$12/lead',
                    status: 'Active'
                  },
                  { 
                    client: 'Elite Home Services', 
                    plan: 'Starter Custom', 
                    monthly: '$800', 
                    leads: '$18/lead',
                    status: 'Pending'
                  },
                ].map((client, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-semibold text-slate-900">{client.client}</h4>
                            <p className="text-sm text-slate-600">{client.plan}</p>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-600">Monthly: </span>
                            <span className="font-medium text-slate-900">{client.monthly}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-600">Per Lead: </span>
                            <span className="font-medium text-slate-900">{client.leads}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {client.status}
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

          {activeTab !== 'pricing' && (
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

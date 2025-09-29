// src/pages/provider/clients.tsx

/**
 * 🏢 CLIENT MANAGEMENT DASHBOARD
 * 
 * Comprehensive client provisioning and management interface.
 * Enterprise-grade client lifecycle management.
 * 
 * FEATURES:
 * - Client provisioning and onboarding
 * - Subscription management and billing
 * - Health monitoring and alerts
 * - White-label branding configuration
 * - Support ticket management
 * - Performance analytics per client
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProviderLayout from '@/components/ProviderLayout';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Client {
  id: string;
  name: string;
  email: string;
  plan: 'BASE' | 'PRO' | 'ELITE';
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  creditsRemaining: number;
  monthlyUsage: number;
  conversionCount: number;
  revenue: number;
  health: 'excellent' | 'good' | 'warning' | 'critical';
  lastActivity: string;
  subscriptionStartDate: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  brandConfig?: {
    name: string;
    logo?: string;
    primaryColor?: string;
    domain?: string;
  };
  supportTickets: number;
  churnRisk: number;
}

interface NewClientData {
  name: string;
  email: string;
  plan: 'BASE' | 'PRO' | 'ELITE';
  brandName?: string;
  domain?: string;
  autoProvision: boolean;
}

export default function ClientManagementPage() {
  const router = useRouter();
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newClientData, setNewClientData] = useState<NewClientData>({
    name: '',
    email: '',
    plan: 'BASE',
    autoProvision: true
  });

  // Fetch clients data
  const { data: clientsData, error, mutate } = useSWR('/api/provider/clients', fetcher);
  const clients: Client[] = clientsData?.clients || [];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const createClient = async () => {
    try {
      const response = await fetch('/api/provider/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });

      if (response.ok) {
        setShowNewClientModal(false);
        setNewClientData({
          name: '',
          email: '',
          plan: 'BASE',
          autoProvision: true
        });
        mutate(); // Refresh clients list
      }
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  };

  const upgradeClient = async (clientId: string, newPlan: string) => {
    try {
      const response = await fetch(`/api/provider/clients/${clientId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      });

      if (response.ok) {
        mutate(); // Refresh clients list
      }
    } catch (error) {
      console.error('Failed to upgrade client:', error);
    }
  };

  const suspendClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/provider/clients/${clientId}/suspend`, {
        method: 'POST'
      });

      if (response.ok) {
        mutate(); // Refresh clients list
      }
    } catch (error) {
      console.error('Failed to suspend client:', error);
    }
  };

  const bulkAction = async (action: string) => {
    for (const clientId of selectedClients) {
      switch (action) {
        case 'suspend':
          await suspendClient(clientId);
          break;
        case 'activate':
          // Implement activate logic
          break;
        case 'upgrade':
          // Show upgrade modal for bulk
          break;
      }
    }
    setSelectedClients([]);
    mutate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'trial': return 'text-blue-400 bg-blue-500/20';
      case 'inactive': return 'text-slate-400 bg-slate-500/20';
      case 'suspended': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'ELITE': return 'text-purple-400 bg-purple-500/20';
      case 'PRO': return 'text-blue-400 bg-blue-500/20';
      case 'BASE': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <ProviderLayout title="Client Management">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              🏢 Client Management
            </h1>
            <p className="text-slate-400 mt-2">
              Provision, manage, and monitor client organizations
            </p>
          </div>
          <div className="flex space-x-4">
            {selectedClients.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => bulkAction('suspend')}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Suspend ({selectedClients.length})
                </button>
                <button
                  onClick={() => bulkAction('activate')}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  Activate ({selectedClients.length})
                </button>
              </div>
            )}
            <button
              onClick={() => setShowNewClientModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
            >
              + New Client
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="text-slate-400 text-sm">
            {filteredClients.length} of {clients.length} clients
          </div>
        </div>

        {/* Client Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Clients</p>
                <p className="text-2xl font-bold text-green-400">{clients.length}</p>
              </div>
              <div className="text-3xl">🏢</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Clients</p>
                <p className="text-2xl font-bold text-blue-400">
                  {clients.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Trial Clients</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {clients.filter(c => c.status === 'trial').length}
                </p>
              </div>
              <div className="text-3xl">🔄</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">At Risk</p>
                <p className="text-2xl font-bold text-red-400">
                  {clients.filter(c => c.churnRisk > 70).length}
                </p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClients(filteredClients.map(c => c.id));
                        } else {
                          setSelectedClients([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-slate-300">Client</th>
                  <th className="text-left py-3 px-4 text-slate-300">Plan</th>
                  <th className="text-left py-3 px-4 text-slate-300">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300">Health</th>
                  <th className="text-left py-3 px-4 text-slate-300">Revenue</th>
                  <th className="text-left py-3 px-4 text-slate-300">Usage</th>
                  <th className="text-left py-3 px-4 text-slate-300">Risk</th>
                  <th className="text-left py-3 px-4 text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients([...selectedClients, client.id]);
                          } else {
                            setSelectedClients(selectedClients.filter(id => id !== client.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-white">{client.name}</div>
                        <div className="text-sm text-slate-400">{client.email}</div>
                        {client.brandConfig?.domain && (
                          <div className="text-xs text-green-400">{client.brandConfig.domain}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${getPlanColor(client.plan)}`}>
                        {client.plan}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={getHealthColor(client.health)}>
                        {client.health}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-green-400 font-semibold">
                      {formatCurrency(client.revenue)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-300">
                        {client.monthlyUsage.toLocaleString()} credits
                      </div>
                      <div className="text-xs text-slate-400">
                        {client.creditsRemaining.toLocaleString()} remaining
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              client.churnRisk < 30 ? 'bg-green-500' :
                              client.churnRisk < 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${client.churnRisk}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-300 text-sm">{client.churnRisk}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/provider/clients/${client.id}`)}
                          className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => upgradeClient(client.id, client.plan === 'BASE' ? 'PRO' : 'ELITE')}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors text-sm"
                        >
                          Upgrade
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Client Modal */}
        {showNewClientModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-2xl border border-green-500/20 p-8 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-white mb-6">Create New Client</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="admin@acme.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Plan
                  </label>
                  <select
                    value={newClientData.plan}
                    onChange={(e) => setNewClientData({...newClientData, plan: e.target.value as any})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="BASE">BASE - $99/month</option>
                    <option value="PRO">PRO - $299/month</option>
                    <option value="ELITE">ELITE - $599/month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Brand Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newClientData.brandName || ''}
                    onChange={(e) => setNewClientData({...newClientData, brandName: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="Custom brand name"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newClientData.autoProvision}
                    onChange={(e) => setNewClientData({...newClientData, autoProvision: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-slate-300">
                    Auto-provision and send welcome email
                  </label>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createClient}
                  disabled={!newClientData.name || !newClientData.email}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50"
                >
                  Create Client
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}

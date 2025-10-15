'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Webhook, Key, Activity } from 'lucide-react';

type FederatedClient = {
  id: string;
  orgId: string;
  name: string;
  contactEmail: string;
  planType: string;
  apiKeyId: string;
  webhookEndpoint: string | null;
  lastSeen: string | null;
  monthlyRevenue: number;
  convertedLeads: number;
  createdAt: string;
  updatedAt: string;
};

export default function FederatedClientsSection() {
  const [clients, setClients] = useState<FederatedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState<string>('all');

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchClients in useCallback
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (planFilter !== 'all') params.set('planType', planFilter);

      const res = await fetch(`/api/federation/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching federated clients:', error);
    } finally {
      setLoading(false);
    }
  }, [planFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const stats = {
    total: clients.length,
    totalRevenue: clients.reduce((sum, c) => sum + c.monthlyRevenue, 0),
    totalLeads: clients.reduce((sum, c) => sum + c.convertedLeads, 0),
    activeClients: clients.filter(c => c.lastSeen && new Date(c.lastSeen) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Federated Clients
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage external organizations using the federation API
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Clients</div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4" style={{ color: 'var(--accent-success)' }} />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Monthly Revenue</div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-success)' }}>
            ${(stats.totalRevenue / 100).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-info)' }} />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Converted Leads</div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalLeads}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" style={{ color: 'var(--accent-warning)' }} />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active (7d)</div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.activeClients}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Plan Type
          </label>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Loading federated clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            No federated clients found. {planFilter !== 'all' ? 'Try adjusting your filter.' : 'Clients will appear here when they register via the federation API.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-primary)' }}>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Organization</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Plan</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>API Key</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Webhook</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Revenue</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Leads</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const isActive = client.lastSeen && new Date(client.lastSeen) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr
                    key={client.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="p-4">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{client.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{client.contactEmail}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>Org: {client.orgId}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          background: 'var(--surface-3)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {client.planType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" style={{ color: 'var(--accent-success)' }} />
                        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {client.apiKeyId.substring(0, 12)}...
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {client.webhookEndpoint ? (
                        <div className="flex items-center gap-2">
                          <Webhook className="h-4 w-4" style={{ color: 'var(--accent-success)' }} />
                          <span className="text-xs" style={{ color: 'var(--accent-success)' }}>Configured</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Not set</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" style={{ color: 'var(--accent-success)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {(client.monthlyRevenue / 100).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {client.convertedLeads}
                    </td>
                    <td className="p-4">
                      {client.lastSeen ? (
                        <div>
                          <div className="text-sm" style={{ color: isActive ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                            {new Date(client.lastSeen).toLocaleDateString()}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Never</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


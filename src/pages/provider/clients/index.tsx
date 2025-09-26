// src/pages/provider/clients/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useMe } from '@/lib/useMe';
import { useRouter } from 'next/router';

type Client = {
  id: string;
  name: string;
  leadsThisMonth: number;
  convertedThisMonth: number;
  revenueThisMonth: number;
  totalLeads: number;
  totalConverted: number;
  totalRevenue: number;
  status: 'active' | 'inactive' | 'trial';
  lastActivity: string;
  userCount: number;
  createdAt: string;
};

export default function ClientsPage() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [sortBy, setSortBy] = useState<'revenue' | 'leads' | 'activity' | 'name'>('revenue');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'trial' | 'inactive'>('all');

  // Redirect non-providers
  useEffect(() => {
    if (!loading && me?.role !== 'PROVIDER') {
      router.push('/dashboard');
    }
  }, [me, loading, router]);

  useEffect(() => {
    if (me?.role === 'PROVIDER') {
      fetchClients();
    }
  }, [me]);

  const fetchClients = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/provider/clients');
      const data = await response.json();
      
      if (data.ok) {
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Filter and sort clients
  const processedClients = clients
    .filter(client => {
      if (filterBy === 'all') return true;
      return client.status === filterBy;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.revenueThisMonth - a.revenueThisMonth;
        case 'leads':
          return b.leadsThisMonth - a.leadsThisMonth;
        case 'activity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'trial': return 'bg-yellow-500/20 text-yellow-400';
      case 'inactive': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading || me?.role !== 'PROVIDER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Client Management • Provider Portal</title>
      </Head>
      
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/provider" className="text-sm" style={{ color: 'var(--brand-primary)' }}>
                ← Provider Portal
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gradient">Client Management</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Manage all client organizations and their performance
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/provider/clients/new')}
              className="btn-primary"
            >
              <span>+ Add Client</span>
            </button>
            <button 
              onClick={fetchClients}
              className="btn-secondary"
              disabled={loadingData}
            >
              <span>{loadingData ? '🔄' : '↻'} Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="premium-card">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-field min-w-0"
              >
                <option value="revenue">Monthly Revenue</option>
                <option value="leads">Monthly Leads</option>
                <option value="activity">Last Activity</option>
                <option value="name">Name</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Filter:
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="input-field min-w-0"
              >
                <option value="all">All Clients</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="ml-auto text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {processedClients.length} of {clients.length} clients
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">All Clients</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Complete client organization overview
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>This Month</th>
                  <th>All Time</th>
                  <th>Users</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedClients.length === 0 && !loadingData ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="space-y-2">
                        <div className="text-lg" style={{ color: 'var(--text-tertiary)' }}>
                          No clients found
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Try adjusting your filters or add new clients
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {client.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {client.name}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Since {new Date(client.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusColor(client.status)}`}>
                          {client.status}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          <div className="font-medium text-gradient">
                            ${client.revenueThisMonth.toLocaleString()}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {client.leadsThisMonth} leads, {client.convertedThisMonth} converted
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          <div className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                            ${client.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {client.totalLeads} leads, {client.totalConverted} converted
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {client.userCount}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(client.lastActivity).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => router.push(`/provider/clients/${client.id}`)}
                            className="btn-outline text-xs"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => router.push(`/provider/clients/${client.id}/settings`)}
                            className="btn-outline text-xs"
                          >
                            Settings
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
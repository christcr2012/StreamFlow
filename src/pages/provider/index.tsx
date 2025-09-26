// src/pages/provider/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useMe } from '@/lib/useMe';
import { useRouter } from 'next/router';

type ProviderMetrics = {
  totalClients: number;
  totalLeads: number;
  convertedLeads: number;
  totalRevenue: number;
  monthlyRevenue: number;
  aiCostThisMonth: number;
  profitMargin: number;
};

type ClientSummary = {
  id: string;
  name: string;
  leadsThisMonth: number;
  convertedThisMonth: number;
  revenueThisMonth: number;
  status: 'active' | 'inactive' | 'trial';
  lastActivity: string;
};

export default function ProviderPortal() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [metrics, setMetrics] = useState<ProviderMetrics | null>(null);
  const [topClients, setTopClients] = useState<ClientSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect non-providers
  useEffect(() => {
    if (!loading && me?.role !== 'PROVIDER') {
      router.push('/dashboard');
    }
  }, [me, loading, router]);

  useEffect(() => {
    if (me?.role === 'PROVIDER') {
      fetchProviderData();
    }
  }, [me]);

  const fetchProviderData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch provider metrics
      const metricsRes = await fetch('/api/provider/metrics');
      const metricsData = await metricsRes.json();
      
      // Fetch top clients
      const clientsRes = await fetch('/api/provider/clients/summary');
      const clientsData = await clientsRes.json();
      
      if (metricsData.ok) setMetrics(metricsData.metrics);
      if (clientsData.ok) setTopClients(clientsData.clients || []);
      
    } catch (error) {
      console.error('Failed to fetch provider data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Show loading or unauthorized states
  if (loading || me?.role !== 'PROVIDER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading Provider Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Provider Portal • Mountain Vista</title>
      </Head>
      
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Provider Portal
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Multi-client lead generation & revenue management
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
              onClick={fetchProviderData}
              className="btn-secondary"
              disabled={loadingData}
            >
              <span>{loadingData ? '🔄' : '↻'} Refresh</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Total Clients
              </h3>
              <span className="text-2xl">🏢</span>
            </div>
            <p className="text-3xl font-bold text-gradient">
              {metrics?.totalClients || 0}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Active organizations
            </p>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Monthly Revenue
              </h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-gradient">
              ${metrics?.monthlyRevenue?.toLocaleString() || '0'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              ${metrics?.totalRevenue?.toLocaleString() || '0'} total
            </p>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                AI Costs This Month
              </h3>
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-3xl font-bold" style={{ 
              color: (metrics?.aiCostThisMonth || 0) > 45 ? 'var(--accent-warning)' : 'var(--accent-success)'
            }}>
              ${metrics?.aiCostThisMonth?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              ${(50 - (metrics?.aiCostThisMonth || 0)).toFixed(2)} remaining
            </p>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Profit Margin
              </h3>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-bold text-gradient">
              {((metrics?.profitMargin || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              After AI costs
            </p>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lead Performance */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
              <div>
                <h2 className="text-xl font-semibold text-gradient">Lead Performance</h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Cross-client lead generation metrics
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border-primary)' 
              }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Total Leads</p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>All-time across clients</p>
                </div>
                <p className="text-xl font-bold text-gradient">
                  {metrics?.totalLeads?.toLocaleString() || '0'}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border-primary)' 
              }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Converted Leads</p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Billable conversions</p>
                </div>
                <p className="text-xl font-bold" style={{ color: 'var(--accent-success)' }}>
                  {metrics?.convertedLeads?.toLocaleString() || '0'}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border-primary)' 
              }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Conversion Rate</p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Lead to client conversion</p>
                </div>
                <p className="text-xl font-bold text-gradient">
                  {metrics?.totalLeads 
                    ? ((metrics.convertedLeads / metrics.totalLeads) * 100).toFixed(1) 
                    : '0'}%
                </p>
              </div>
            </div>
          </div>

          {/* Top Clients */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
                <div>
                  <h2 className="text-xl font-semibold text-gradient">Top Clients</h2>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Highest performing this month
                  </p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/provider/clients')}
                className="btn-outline text-xs"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {topClients.length === 0 && !loadingData ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    No client data available
                  </p>
                </div>
              ) : (
                topClients.slice(0, 5).map((client, index) => (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
                    style={{ 
                      background: 'var(--surface-2)', 
                      border: '1px solid var(--border-primary)' 
                    }}
                    onClick={() => router.push(`/provider/clients/${client.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {client.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {client.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {client.convertedThisMonth} conversions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gradient">
                        ${client.revenueThisMonth.toLocaleString()}
                      </p>
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        client.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {client.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Quick Actions</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Common provider management tasks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/provider/clients/new')}
              className="btn-primary flex flex-col items-center gap-2 p-6"
            >
              <span className="text-2xl">➕</span>
              <span>Add New Client</span>
            </button>
            
            <button 
              onClick={() => router.push('/provider/analytics')}
              className="btn-secondary flex flex-col items-center gap-2 p-6"
            >
              <span className="text-2xl">📊</span>
              <span>View Analytics</span>
            </button>
            
            <button 
              onClick={() => router.push('/provider/revenue')}
              className="btn-secondary flex flex-col items-center gap-2 p-6"
            >
              <span className="text-2xl">💰</span>
              <span>Revenue Report</span>
            </button>
            
            <button 
              onClick={() => router.push('/provider/settings')}
              className="btn-secondary flex flex-col items-center gap-2 p-6"
            >
              <span className="text-2xl">⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
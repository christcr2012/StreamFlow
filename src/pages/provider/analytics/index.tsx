// src/pages/provider/analytics/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useMe } from '@/lib/useMe';
import { useRouter } from 'next/router';

type AnalyticsData = {
  overview: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalRevenue: number;
    averageRevenuePerClient: number;
    growthRate: number;
  };
  monthly: Array<{
    month: string;
    leads: number;
    conversions: number;
    revenue: number;
    aiCost: number;
    profit: number;
  }>;
  clientPerformance: Array<{
    clientId: string;
    clientName: string;
    leads: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    growth: number;
  }>;
  sourceBreakdown: Array<{
    source: string;
    leads: number;
    conversions: number;
    revenue: number;
    percentage: number;
  }>;
};

export default function AnalyticsPage() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | '1y'>('90d');

  // Redirect non-providers
  useEffect(() => {
    if (!loading && me?.role !== 'PROVIDER') {
      router.push('/dashboard');
    }
  }, [me, loading, router]);

  useEffect(() => {
    if (me?.role === 'PROVIDER') {
      fetchAnalytics();
    }
  }, [me, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/provider/analytics?range=${timeRange}`);
      const result = await response.json();
      
      if (result.ok) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || me?.role !== 'PROVIDER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics • Provider Portal</title>
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
            <h1 className="text-3xl font-bold text-gradient">Cross-Client Analytics</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Performance insights across all client organizations
            </p>
          </div>
          
          <div className="flex gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="input-field"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
            <button 
              onClick={fetchAnalytics}
              className="btn-secondary"
              disabled={loadingData}
            >
              <span>{loadingData ? '🔄' : '↻'} Refresh</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Total Conversion Rate
              </h3>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-3xl font-bold text-gradient">
              {data?.overview.conversionRate?.toFixed(1) || '0.0'}%
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {data?.overview.convertedLeads || 0} of {data?.overview.totalLeads || 0} leads
            </p>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Average Revenue per Client
              </h3>
              <span className="text-2xl">💼</span>
            </div>
            <p className="text-3xl font-bold text-gradient">
              ${data?.overview.averageRevenuePerClient?.toLocaleString() || '0'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              ${data?.overview.totalRevenue?.toLocaleString() || '0'} total
            </p>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Growth Rate
              </h3>
              <span className="text-2xl">📈</span>
            </div>
            <p className={`text-3xl font-bold ${(data?.overview.growthRate || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(data?.overview.growthRate || 0) >= 0 ? '+' : ''}{data?.overview.growthRate?.toFixed(1) || '0.0'}%
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              vs previous period
            </p>
          </div>
        </div>

        {/* Monthly Performance Chart */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
              <div>
                <h2 className="text-xl font-semibold text-gradient">Monthly Performance</h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Revenue, costs, and profit trends
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {data?.monthly?.map((month, index) => (
              <div 
                key={month.month}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border-primary)' 
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {new Date(month.month).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {new Date(month.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {month.leads} leads • {month.conversions} conversions
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-gradient text-lg">
                    ${month.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    ${month.aiCost.toFixed(2)} AI cost • ${month.profit.toLocaleString()} profit
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <p style={{ color: 'var(--text-tertiary)' }}>No monthly data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Performance & Lead Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Clients */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
              <div>
                <h2 className="text-xl font-semibold text-gradient">Client Performance</h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Top performing clients by revenue
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {data?.clientPerformance?.slice(0, 5).map((client, index) => (
                <div 
                  key={client.clientId}
                  className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
                  style={{ 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border-primary)' 
                  }}
                  onClick={() => router.push(`/provider/clients/${client.clientId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {client.clientName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {client.conversions} conversions • {client.conversionRate.toFixed(1)}% rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gradient">
                      ${client.revenue.toLocaleString()}
                    </p>
                    <p className={`text-xs ${client.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {client.growth >= 0 ? '+' : ''}{client.growth.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--text-tertiary)' }}>No client data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Lead Sources */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
              <div>
                <h2 className="text-xl font-semibold text-gradient">Lead Sources</h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Performance by lead source type
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {data?.sourceBreakdown?.map((source, index) => (
                <div 
                  key={source.source}
                  className="p-3 rounded-lg"
                  style={{ 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border-primary)' 
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {source.source}
                    </p>
                    <p className="font-bold text-gradient">
                      ${source.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p style={{ color: 'var(--text-tertiary)' }}>
                      {source.leads} leads • {source.conversions} converted
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      {source.percentage.toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--text-tertiary)' }}>No source data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
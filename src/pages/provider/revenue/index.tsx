// src/pages/provider/revenue/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useMe } from '@/lib/useMe';
import { useRouter } from 'next/router';

type RevenueData = {
  summary: {
    totalRevenue: number;
    monthlyRevenue: number;
    pendingRevenue: number;
    aiCosts: number;
    netProfit: number;
    profitMargin: number;
    averageRevenuePerLead: number;
    projectedMonthlyRevenue: number;
  };
  monthlyBreakdown: Array<{
    month: string;
    leads: number;
    conversions: number;
    revenue: number;
    aiCost: number;
    netProfit: number;
    profitMargin: number;
  }>;
  clientRevenue: Array<{
    clientId: string;
    clientName: string;
    monthlyRevenue: number;
    totalRevenue: number;
    conversions: number;
    averageRevenuePerConversion: number;
    lastPayment: string | null;
    status: 'paid' | 'pending' | 'overdue';
  }>;
  transactions: Array<{
    id: string;
    clientId: string;
    clientName: string;
    amount: number;
    type: 'lead_conversion' | 'ai_cost' | 'adjustment';
    description: string;
    createdAt: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
};

export default function RevenuePage() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | '1y'>('30d');
  const [viewType, setViewType] = useState<'overview' | 'breakdown' | 'transactions'>('overview');

  // Redirect non-providers
  useEffect(() => {
    if (!loading && me?.role !== 'PROVIDER') {
      router.push('/dashboard');
    }
  }, [me, loading, router]);

  useEffect(() => {
    if (me?.role === 'PROVIDER') {
      fetchRevenueData();
    }
  }, [me, timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/provider/revenue?range=${timeRange}`);
      const result = await response.json();
      
      if (result.ok) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue': case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading || me?.role !== 'PROVIDER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Revenue Dashboard • Provider Portal</title>
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
            <h1 className="text-3xl font-bold text-gradient">Revenue Dashboard</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              $100/lead billing across all client organizations
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
              onClick={fetchRevenueData}
              className="btn-secondary"
              disabled={loadingData}
            >
              <span>{loadingData ? '🔄' : '↻'} Refresh</span>
            </button>
          </div>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Monthly Revenue
              </h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-gradient">
              ${data?.summary.monthlyRevenue?.toLocaleString() || '0'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              ${data?.summary.totalRevenue?.toLocaleString() || '0'} total
            </p>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Net Profit
              </h3>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--accent-success)' }}>
              ${data?.summary.netProfit?.toLocaleString() || '0'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {((data?.summary.profitMargin || 0) * 100).toFixed(1)}% margin
            </p>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                AI Costs
              </h3>
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-3xl font-bold" style={{ 
              color: (data?.summary.aiCosts || 0) > 45 ? 'var(--accent-warning)' : 'var(--accent-success)'
            }}>
              ${data?.summary.aiCosts?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              ${(50 - (data?.summary.aiCosts || 0)).toFixed(2)} under limit
            </p>
          </div>

          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Projected Monthly
              </h3>
              <span className="text-2xl">🔮</span>
            </div>
            <p className="text-3xl font-bold text-gradient">
              ${data?.summary.projectedMonthlyRevenue?.toLocaleString() || '0'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Based on current trends
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="premium-card">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewType('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewType === 'overview' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'hover:bg-white/10'
              }`}
              style={{ color: viewType === 'overview' ? 'white' : 'var(--text-secondary)' }}
            >
              Overview
            </button>
            <button
              onClick={() => setViewType('breakdown')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewType === 'breakdown' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'hover:bg-white/10'
              }`}
              style={{ color: viewType === 'breakdown' ? 'white' : 'var(--text-secondary)' }}
            >
              Monthly Breakdown
            </button>
            <button
              onClick={() => setViewType('transactions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewType === 'transactions' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'hover:bg-white/10'
              }`}
              style={{ color: viewType === 'transactions' ? 'white' : 'var(--text-secondary)' }}
            >
              Transactions
            </button>
          </div>
        </div>

        {/* Dynamic Content Based on View Type */}
        {viewType === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Client Revenue */}
            <div className="premium-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
                <div>
                  <h2 className="text-xl font-semibold text-gradient">Client Revenue</h2>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Revenue by client organization
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data?.clientRevenue?.slice(0, 6).map((client) => (
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
                          {client.clientName.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {client.clientName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {client.conversions} conversions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gradient">
                        ${client.monthlyRevenue.toLocaleString()}
                      </p>
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusColor(client.status)}`}>
                        {client.status}
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <p style={{ color: 'var(--text-tertiary)' }}>No client revenue data</p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Metrics */}
            <div className="premium-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
                <div>
                  <h2 className="text-xl font-semibold text-gradient">Revenue Metrics</h2>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Key performance indicators
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border-primary)' 
                }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Average Revenue per Lead</p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Across all conversions</p>
                  </div>
                  <p className="text-xl font-bold text-gradient">
                    ${data?.summary.averageRevenuePerLead?.toFixed(2) || '100.00'}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border-primary)' 
                }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Pending Revenue</p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Awaiting client payment</p>
                  </div>
                  <p className="text-xl font-bold" style={{ color: 'var(--accent-warning)' }}>
                    ${data?.summary.pendingRevenue?.toLocaleString() || '0'}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border-primary)' 
                }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Cost Control</p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>AI costs vs $50 limit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: 'var(--accent-success)' }}>
                      {((1 - (data?.summary.aiCosts || 0) / 50) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Under budget
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewType === 'breakdown' && (
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
              <div>
                <h2 className="text-xl font-semibold text-gradient">Monthly Revenue Breakdown</h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Detailed monthly financial performance
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Leads</th>
                    <th>Conversions</th>
                    <th>Revenue</th>
                    <th>AI Costs</th>
                    <th>Net Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.monthlyBreakdown?.map((month) => (
                    <tr key={month.month}>
                      <td>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {new Date(month.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      </td>
                      <td>{month.leads.toLocaleString()}</td>
                      <td>{month.conversions.toLocaleString()}</td>
                      <td>
                        <div className="font-bold text-gradient">
                          ${month.revenue.toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--accent-warning)' }}>
                          ${month.aiCost.toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold" style={{ color: 'var(--accent-success)' }}>
                          ${month.netProfit.toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">
                          {(month.profitMargin * 100).toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-tertiary)' }}>No monthly data available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewType === 'transactions' && (
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
              <div>
                <h2 className="text-xl font-semibold text-gradient">Recent Transactions</h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  All revenue and cost transactions
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {data?.transactions?.slice(0, 10).map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border-primary)' 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'lead_conversion' ? 'bg-green-500/20' :
                      transaction.type === 'ai_cost' ? 'bg-orange-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      <span className="text-sm">
                        {transaction.type === 'lead_conversion' ? '💰' :
                         transaction.type === 'ai_cost' ? '🤖' : '⚡'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {transaction.clientName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {transaction.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'lead_conversion' ? 'text-green-400' :
                      transaction.type === 'ai_cost' ? 'text-orange-400' :
                      'text-blue-400'
                    }`}>
                      {transaction.type === 'ai_cost' ? '-' : '+'}${transaction.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--text-tertiary)' }}>No transactions available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
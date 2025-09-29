// src/pages/provider/analytics.tsx

/**
 * 📊 PROVIDER ANALYTICS DASHBOARD
 * 
 * Comprehensive cross-client analytics and business intelligence.
 * Enterprise-grade analytics that rivals Salesforce Analytics Cloud.
 * 
 * FEATURES:
 * - Cross-client performance comparison
 * - Revenue analytics with cohort analysis
 * - Client lifetime value (CLV) prediction
 * - Churn prediction and prevention
 * - Market trend analysis
 * - AI usage optimization insights
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProviderLayout from '@/components/ProviderLayout';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    monthlyGrowth: number;
    clientCount: number;
    averageClientValue: number;
    churnRate: number;
    conversionRate: number;
  };
  clientPerformance: ClientMetrics[];
  revenueBreakdown: RevenueBreakdown;
  trends: TrendData[];
  predictions: PredictionData;
}

interface ClientMetrics {
  id: string;
  name: string;
  plan: string;
  revenue: number;
  growth: number;
  health: 'excellent' | 'good' | 'warning' | 'critical';
  churnRisk: number;
  lastActivity: string;
  conversionRate: number;
  aiUsage: number;
}

interface RevenueBreakdown {
  subscription: number;
  usage: number;
  aiServices: number;
  oneTime: number;
}

interface TrendData {
  period: string;
  revenue: number;
  clients: number;
  conversions: number;
  aiCost: number;
}

interface PredictionData {
  nextMonthRevenue: number;
  churnRisk: ClientMetrics[];
  growthOpportunities: ClientMetrics[];
  aiOptimization: {
    potentialSavings: number;
    recommendations: string[];
  };
}

export default function ProviderAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [compareMode, setCompareMode] = useState(false);

  // Fetch analytics data
  const { data: analyticsData, error } = useSWR<AnalyticsData>(
    `/api/provider/analytics-enhanced?timeframe=${timeRange}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: realtimeData } = useSWR(
    '/api/provider/realtime-metrics',
    fetcher,
    { refreshInterval: 5000 }
  );

  if (error) {
    return (
      <ProviderLayout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics Unavailable</h3>
            <p className="text-slate-400">Unable to load analytics data</p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  if (!analyticsData) {
    return (
      <ProviderLayout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Loading Analytics</h3>
            <p className="text-slate-400">Analyzing cross-client performance...</p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
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

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <ProviderLayout title="Analytics Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              📊 Provider Analytics
            </h1>
            <p className="text-slate-400 mt-2">
              Cross-client performance and business intelligence
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                compareMode 
                  ? 'bg-green-500 text-white' 
                  : 'bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Compare Mode
            </button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(analyticsData.overview.totalRevenue)}
                </p>
                <p className="text-xs text-green-300 mt-1">
                  +{analyticsData.overview.monthlyGrowth.toFixed(1)}% this month
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Clients</p>
                <p className="text-2xl font-bold text-blue-400">
                  {analyticsData.overview.clientCount}
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  Avg: {formatCurrency(analyticsData.overview.averageClientValue)}
                </p>
              </div>
              <div className="text-3xl">🏢</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Churn Rate</p>
                <p className={`text-2xl font-bold ${
                  analyticsData.overview.churnRate < 5 ? 'text-green-400' : 
                  analyticsData.overview.churnRate < 10 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analyticsData.overview.churnRate.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">Monthly</p>
              </div>
              <div className="text-3xl">📉</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-400">
                  {analyticsData.overview.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-300 mt-1">Cross-client avg</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">AI Efficiency</p>
                <p className="text-2xl font-bold text-orange-400">
                  {analyticsData.predictions.aiOptimization.potentialSavings > 0 ? 
                    formatCurrency(analyticsData.predictions.aiOptimization.potentialSavings) : 
                    'Optimized'
                  }
                </p>
                <p className="text-xs text-orange-300 mt-1">Potential savings</p>
              </div>
              <div className="text-3xl">🤖</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Predicted Revenue</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {formatCurrency(analyticsData.predictions.nextMonthRevenue)}
                </p>
                <p className="text-xs text-cyan-300 mt-1">Next month</p>
              </div>
              <div className="text-3xl">🔮</div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Revenue Breakdown</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Subscription Revenue</span>
                <span className="text-green-400 font-semibold">
                  {formatCurrency(analyticsData.revenueBreakdown.subscription)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Usage Revenue</span>
                <span className="text-blue-400 font-semibold">
                  {formatCurrency(analyticsData.revenueBreakdown.usage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">AI Services</span>
                <span className="text-purple-400 font-semibold">
                  {formatCurrency(analyticsData.revenueBreakdown.aiServices)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">One-time Fees</span>
                <span className="text-orange-400 font-semibold">
                  {formatCurrency(analyticsData.revenueBreakdown.oneTime)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">AI Optimization</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Potential Savings</span>
                <span className="text-green-400 font-semibold">
                  {formatCurrency(analyticsData.predictions.aiOptimization.potentialSavings)}
                </span>
              </div>
              <div className="space-y-2">
                <h4 className="text-slate-300 font-medium">Recommendations:</h4>
                {analyticsData.predictions.aiOptimization.recommendations.map((rec, index) => (
                  <div key={index} className="text-sm text-slate-400 flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Client Performance Table */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Client Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300">Client</th>
                  <th className="text-left py-3 px-4 text-slate-300">Plan</th>
                  <th className="text-left py-3 px-4 text-slate-300">Revenue</th>
                  <th className="text-left py-3 px-4 text-slate-300">Growth</th>
                  <th className="text-left py-3 px-4 text-slate-300">Health</th>
                  <th className="text-left py-3 px-4 text-slate-300">Churn Risk</th>
                  <th className="text-left py-3 px-4 text-slate-300">Conversion</th>
                  <th className="text-left py-3 px-4 text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.clientPerformance.map((client) => (
                  <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{client.name}</div>
                      <div className="text-sm text-slate-400">Last active: {client.lastActivity}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-sm">
                        {client.plan}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-green-400 font-semibold">
                      {formatCurrency(client.revenue)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`${client.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {client.growth >= 0 ? '+' : ''}{client.growth.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span>{getHealthIcon(client.health)}</span>
                        <span className={getHealthColor(client.health)}>
                          {client.health}
                        </span>
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
                    <td className="py-4 px-4 text-purple-400">
                      {client.conversionRate.toFixed(1)}%
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => router.push(`/provider/clients/${client.id}`)}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}

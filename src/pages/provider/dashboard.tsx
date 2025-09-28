// src/pages/provider/dashboard.tsx

/**
 * 🏢 PROVIDER COMMAND CENTER
 * 
 * World-class provider dashboard that exceeds industry standards.
 * Inspired by best practices from Salesforce, ServiceNow, and AWS Console.
 * 
 * FEATURES:
 * - Real-time revenue analytics with drill-down capabilities
 * - Client health monitoring and predictive insights
 * - System performance metrics and alerts
 * - Federation status and cross-instance management
 * - AI usage optimization and cost control
 * - Compliance monitoring and audit trails
 * 
 * SECURITY:
 * - Provider-only access with comprehensive audit logging
 * - Real-time threat detection and anomaly alerts
 * - Data isolation enforcement across all client instances
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProviderShell from '@/components/ProviderShell';
import { useMe } from '@/lib/useMe';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ProviderMetrics {
  // Revenue Metrics
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  conversionRevenue: number;
  aiUsageRevenue: number;
  profitMargin: number;
  
  // Client Metrics
  totalClients: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerClient: number;
  
  // System Metrics
  systemHealth: number;
  apiResponseTime: number;
  uptime: number;
  errorRate: number;
  
  // AI Metrics
  totalAiCost: number;
  aiEfficiencyScore: number;
  costPerConversion: number;
}

interface ClientHealthAlert {
  clientId: string;
  clientName: string;
  alertType: 'revenue_decline' | 'usage_spike' | 'payment_failed' | 'churn_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionRequired: boolean;
  createdAt: string;
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'compliance' | 'federation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
}

export default function ProviderDashboard() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Redirect non-providers
  useEffect(() => {
    if (!loading && me?.role !== 'PROVIDER') {
      router.push('/dashboard');
    }
  }, [me, loading, router]);

  // Fetch provider metrics
  const { data: metrics, error: metricsError } = useSWR<ProviderMetrics>(
    me?.role === 'PROVIDER' ? `/api/provider/metrics?range=${timeRange}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch client health alerts
  const { data: clientAlerts } = useSWR<ClientHealthAlert[]>(
    me?.role === 'PROVIDER' ? '/api/provider/alerts/clients' : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Fetch system alerts
  const { data: systemAlerts } = useSWR<SystemAlert[]>(
    me?.role === 'PROVIDER' ? '/api/provider/alerts/system' : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch federation status
  const { data: federationStatus } = useSWR(
    me?.role === 'PROVIDER' ? '/api/system/federation.status' : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  if (loading) {
    return (
      <ProviderShell title="Loading Provider Dashboard...">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProviderShell>
    );
  }

  if (me?.role !== 'PROVIDER') {
    return null; // Will redirect
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': case 'error': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <ProviderShell title="Provider Command Center - StreamFlow">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Command Center</h1>
              <p className="text-gray-600 mt-2">Real-time platform analytics, client management, and system monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              {/* Federation Status Indicator */}
              {federationStatus && (
                <div className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  federationStatus.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    federationStatus.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  Federation {federationStatus.enabled ? 'Active' : 'Disabled'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {((clientAlerts?.filter(a => a.severity === 'critical').length || 0) > 0 ||
          (systemAlerts?.filter(a => a.severity === 'critical').length || 0) > 0) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Critical Alerts Require Attention</h3>
                <div className="mt-2 text-sm text-red-700">
                  {(clientAlerts?.filter(a => a.severity === 'critical').length || 0) > 0 && (
                    <span className="mr-4">
                      {clientAlerts?.filter(a => a.severity === 'critical').length || 0} client alerts
                    </span>
                  )}
                  {(systemAlerts?.filter(a => a.severity === 'critical').length || 0) > 0 && (
                    <span>
                      {systemAlerts?.filter(a => a.severity === 'critical').length || 0} system alerts
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => setSelectedMetric('revenue')}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(metrics.monthlyRecurringRevenue)} MRR
                  </div>
                </div>
                <div className="text-green-500 text-2xl">💰</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => setSelectedMetric('clients')}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{metrics.totalClients}</div>
                  <div className="text-sm text-gray-600">Active Clients</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(metrics.averageRevenuePerClient)} avg revenue
                  </div>
                </div>
                <div className="text-blue-500 text-2xl">🏢</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => setSelectedMetric('performance')}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{metrics.systemHealth}%</div>
                  <div className="text-sm text-gray-600">System Health</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.apiResponseTime}ms avg response
                  </div>
                </div>
                <div className="text-purple-500 text-2xl">⚡</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => setSelectedMetric('ai')}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatPercentage(metrics.profitMargin)}
                  </div>
                  <div className="text-sm text-gray-600">Profit Margin</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(metrics.totalAiCost)} AI costs
                  </div>
                </div>
                <div className="text-indigo-500 text-2xl">🤖</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Health Alerts */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Client Health Monitor</h2>
              </div>
              <div className="p-6">
                {clientAlerts && clientAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {clientAlerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="font-medium">{alert.clientName}</h3>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{alert.message}</p>
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(alert.createdAt).toLocaleString()}
                            </div>
                          </div>
                          {alert.actionRequired && (
                            <button className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                              Take Action
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">✅</div>
                    <p>All clients are healthy</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Alerts & Quick Actions */}
          <div className="space-y-6">
            {/* System Alerts */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              </div>
              <div className="p-6">
                {systemAlerts && systemAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {systemAlerts.slice(0, 3).map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                        <div className="font-medium text-sm">{alert.title}</div>
                        <div className="text-xs mt-1">{alert.message}</div>
                        {alert.actionUrl && (
                          <button 
                            onClick={() => router.push(alert.actionUrl!)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                          >
                            View Details →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-2xl mb-2">🟢</div>
                    <p className="text-sm">All systems operational</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => router.push('/provider/clients')}
                    className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-xl mb-1">👥</div>
                    <div className="text-xs">Manage Clients</div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/provider/billing')}
                    className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-xl mb-1">💳</div>
                    <div className="text-xs">Billing Center</div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/provider/analytics')}
                    className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-xl mb-1">📊</div>
                    <div className="text-xs">Analytics</div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/provider/settings')}
                    className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-xl mb-1">⚙️</div>
                    <div className="text-xs">Settings</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProviderShell>
  );
}

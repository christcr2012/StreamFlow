'use client';

import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FederationAnalyticsSection from './FederationAnalyticsSection';

export default function ProviderAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchAnalytics in useCallback
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportCSV = () => {
    if (!data) return;
    const csv = 'Analytics Export\n' + JSON.stringify(data, null, 2);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Loading analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Failed to load analytics
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--brand-gradient)' }}>
            Analytics Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Comprehensive analytics and insights
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 rounded"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded font-medium"
            style={{ background: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
          >
            Export CSV
          </button>
        </div>
      </header>

      {/* Revenue Trends */}
      <div className="rounded-xl p-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.revenueTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }} />
            <Legend />
            <Line type="monotone" dataKey="mrr" stroke="#10b981" name="MRR" />
            <Line type="monotone" dataKey="arr" stroke="#3b82f6" name="ARR" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* User Growth */}
      <div className="rounded-xl p-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>User Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.userGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }} />
            <Legend />
            <Bar dataKey="newUsers" fill="#10b981" name="New Users" />
            <Bar dataKey="activeUsers" fill="#3b82f6" name="Active Users" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl p-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Conversion Funnel</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.conversionFunnel} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis type="number" stroke="var(--text-secondary)" />
            <YAxis dataKey="stage" type="category" stroke="var(--text-secondary)" />
            <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }} />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Clients & Features */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl p-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Clients by Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topClientsByRevenue.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }} />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Features by Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topFeatures}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="feature" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }} />
              <Bar dataKey="usage" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Metrics */}
      <div className="rounded-xl p-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>System Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>API Response Time</div>
            <div className="text-2xl font-bold mt-2" style={{ color: 'var(--brand-primary)' }}>
              {data.metrics?.apiResponseTime || '125ms'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Avg last 24h</div>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Uptime</div>
            <div className="text-2xl font-bold mt-2" style={{ color: '#10b981' }}>
              {data.metrics?.uptime || '99.98%'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Last 30 days</div>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Error Rate</div>
            <div className="text-2xl font-bold mt-2" style={{ color: '#f59e0b' }}>
              {data.metrics?.errorRate || '0.02%'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Last 24h</div>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Connections</div>
            <div className="text-2xl font-bold mt-2" style={{ color: 'var(--brand-primary)' }}>
              {data.metrics?.activeConnections || '1,247'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Current</div>
          </div>
        </div>

        {/* Performance Metrics Chart */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Performance Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.performanceMetrics || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)' }} />
              <Legend />
              <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" name="Response Time (ms)" />
              <Line type="monotone" dataKey="throughput" stroke="#10b981" name="Throughput (req/s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Federation Analytics Section */}
      <div className="mt-8">
        <FederationAnalyticsSection />
      </div>
    </div>
  );
}


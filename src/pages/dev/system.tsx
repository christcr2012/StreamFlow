// src/pages/dev/system.tsx

/**
 * ⚡ SYSTEM MONITORING DASHBOARD
 * 
 * Real-time system monitoring and performance analytics.
 * Comprehensive infrastructure monitoring for developers.
 * 
 * FEATURES:
 * - Real-time system metrics
 * - Performance monitoring
 * - Error tracking and alerting
 * - Resource utilization
 * - Database performance
 * - API endpoint monitoring
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DeveloperLayout from '@/components/DeveloperLayout';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  activeUsers: number;
  apiCalls: number;
  errorRate: number;
  responseTime: number;
  databaseConnections: number;
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function SystemMonitorPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system metrics with auto-refresh
  const { data: metricsData } = useSWR(
    '/api/dev/system/metrics',
    fetcher,
    { refreshInterval: autoRefresh ? 5000 : 0 }
  );

  const { data: alertsData } = useSWR('/api/dev/system/alerts', fetcher);
  const { data: logsData } = useSWR(`/api/dev/system/logs?range=${timeRange}`, fetcher);

  const metrics: SystemMetrics = metricsData?.metrics || {
    cpu: 0, memory: 0, disk: 0, network: 0, uptime: 0,
    activeUsers: 0, apiCalls: 0, errorRate: 0, responseTime: 0,
    databaseConnections: 0
  };

  const alerts: AlertItem[] = alertsData?.alerts || [];
  const logs = logsData?.logs || [];

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <DeveloperLayout title="System Monitor">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              ⚡ System Monitor
            </h1>
            <p className="text-slate-400 mt-2">
              Real-time system performance and health monitoring
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">CPU Usage</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.cpu, { warning: 70, critical: 90 })}`}>
                  {metrics.cpu.toFixed(1)}%
                </p>
              </div>
              <div className="text-3xl">🖥️</div>
            </div>
            <div className="mt-4 bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.cpu}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Memory Usage</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.memory, { warning: 80, critical: 95 })}`}>
                  {metrics.memory.toFixed(1)}%
                </p>
              </div>
              <div className="text-3xl">💾</div>
            </div>
            <div className="mt-4 bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.memory}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-green-400">
                  {metrics.activeUsers.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500">
                Uptime: {formatUptime(metrics.uptime)}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Error Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.errorRate, { warning: 1, critical: 5 })}`}>
                  {metrics.errorRate.toFixed(2)}%
                </p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500">
                Avg Response: {metrics.responseTime}ms
              </p>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">API Performance</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total API Calls</span>
                <span className="text-green-400 font-semibold">{metrics.apiCalls.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Average Response Time</span>
                <span className="text-green-400 font-semibold">{metrics.responseTime}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Success Rate</span>
                <span className="text-green-400 font-semibold">{(100 - metrics.errorRate).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Database Connections</span>
                <span className="text-green-400 font-semibold">{metrics.databaseConnections}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Resource Usage</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Disk Usage</span>
                  <span className="text-green-400">{metrics.disk.toFixed(1)}%</span>
                </div>
                <div className="bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full"
                    style={{ width: `${metrics.disk}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Network I/O</span>
                  <span className="text-green-400">{metrics.network.toFixed(1)} MB/s</span>
                </div>
                <div className="bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full"
                    style={{ width: `${Math.min(metrics.network * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts and Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">System Alerts</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {alerts.length > 0 ? alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.type === 'error' ? 'bg-red-500/10 border-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                    'bg-blue-500/10 border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span className="text-white font-medium">{alert.message}</span>
                    </div>
                    {alert.resolved && (
                      <span className="text-green-400 text-sm">✓ Resolved</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              )) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-slate-400">No active alerts</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Logs</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length > 0 ? logs.map((log: any, index: number) => (
                <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-mono ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-slate-400 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mt-1">{log.message}</p>
                </div>
              )) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-slate-400">No recent logs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DeveloperLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';

type FederationMetrics = {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  oidcTestsTotal: number;
  oidcTestsSuccessful: number;
  oidcTestsFailed: number;
  oidcSuccessRate: number;
  averageTestDuration: number;
  recentTests: {
    id: string;
    timestamp: string;
    status: 'success' | 'failed';
    duration: number;
    error?: string;
  }[];
  keyUsage: {
    keyId: string;
    lastUsed: string;
    requestCount: number;
  }[];
};

export default function FederationHealthPage() {
  const [metrics, setMetrics] = useState<FederationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchMetrics in useCallback
  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/observability/federation?range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching federation metrics:', error);
      // Mock data for demonstration
      setMetrics({
        totalKeys: 12,
        activeKeys: 10,
        revokedKeys: 2,
        oidcTestsTotal: 156,
        oidcTestsSuccessful: 148,
        oidcTestsFailed: 8,
        oidcSuccessRate: 94.9,
        averageTestDuration: 342,
        recentTests: [
          { id: 'test_1', timestamp: new Date().toISOString(), status: 'success', duration: 298 },
          { id: 'test_2', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'success', duration: 315 },
          { id: 'test_3', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'failed', duration: 1200, error: 'Token exchange failed' },
          { id: 'test_4', timestamp: new Date(Date.now() - 10800000).toISOString(), status: 'success', duration: 287 },
          { id: 'test_5', timestamp: new Date(Date.now() - 14400000).toISOString(), status: 'success', duration: 356 },
        ],
        keyUsage: [
          { keyId: 'key_abc123', lastUsed: new Date().toISOString(), requestCount: 1247 },
          { keyId: 'key_def456', lastUsed: new Date(Date.now() - 3600000).toISOString(), requestCount: 892 },
          { keyId: 'key_ghi789', lastUsed: new Date(Date.now() - 86400000).toISOString(), requestCount: 456 },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Federation Health Metrics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-sm text-gray-500">Loading metrics...</p>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Keys</dt>
                      <dd className="text-lg font-semibold text-gray-900">{metrics.activeKeys} / {metrics.totalKeys}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">OIDC Success Rate</dt>
                      <dd className="text-lg font-semibold text-gray-900">{metrics.oidcSuccessRate}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total OIDC Tests</dt>
                      <dd className="text-lg font-semibold text-gray-900">{metrics.oidcTestsTotal}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Test Duration</dt>
                      <dd className="text-lg font-semibold text-gray-900">{metrics.averageTestDuration}ms</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent OIDC Tests */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent OIDC Tests</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.recentTests.map((test) => (
                      <tr key={test.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <code className="text-xs">{test.id}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(test.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            test.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {test.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {test.duration}ms
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {test.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Key Usage */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Federation Key Usage</h3>
              <div className="space-y-4">
                {metrics.keyUsage.map((key, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <code className="text-sm text-gray-900">{key.keyId}</code>
                      <p className="text-xs text-gray-500 mt-1">
                        Last used: {new Date(key.lastUsed).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{key.requestCount.toLocaleString()} requests</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No metrics available</p>
        </div>
      )}
    </div>
  );
}


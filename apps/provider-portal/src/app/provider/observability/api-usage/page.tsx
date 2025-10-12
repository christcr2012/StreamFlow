'use client';

import { useState } from 'react';

export default function APIUsagePage() {
  const [metrics] = useState({
    totalRequests: 45678,
    rateLimitViolations: 23,
    topEndpoints: [
      { endpoint: '/api/monetization/plans', requests: 12456, rateLimits: 5 },
      { endpoint: '/api/monetization/prices', requests: 9823, rateLimits: 3 },
      { endpoint: '/api/federation/keys', requests: 8734, rateLimits: 8 },
      { endpoint: '/api/federation/oidc', requests: 7234, rateLimits: 2 },
    ],
    recentRateLimits: [
      { timestamp: new Date().toISOString(), endpoint: '/api/federation/keys', ip: '192.168.1.100', retryAfter: 60 },
      { timestamp: new Date(Date.now() - 1800000).toISOString(), endpoint: '/api/monetization/plans', ip: '192.168.1.101', retryAfter: 60 },
    ],
  });

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-6">API Usage & Rate Limits</h2>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
          <dd className="text-lg font-semibold text-gray-900">{metrics.totalRequests.toLocaleString()}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Rate Limit Violations (429s)</dt>
          <dd className="text-lg font-semibold text-gray-900">{metrics.rateLimitViolations}</dd>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Endpoints</h3>
        <div className="space-y-4">
          {metrics.topEndpoints.map((endpoint, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between text-sm mb-1">
                <code className="text-gray-600 text-xs">{endpoint.endpoint}</code>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-900">{endpoint.requests.toLocaleString()} requests</span>
                  <span className="text-red-600">{endpoint.rateLimits} 429s</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(endpoint.requests / metrics.totalRequests) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Rate Limit Violations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retry After</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.recentRateLimits.map((limit, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(limit.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <code className="text-xs">{limit.endpoint}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{limit.ip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{limit.retryAfter}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';

export default function MonetizationMetricsPage() {
  const [metrics, setMetrics] = useState({
    totalPlans: 8,
    activePlans: 6,
    totalPrices: 24,
    activeCoupons: 12,
    writeOperations: 156,
    writeErrors: 3,
    errorRate: 1.9,
    recentErrors: [
      { timestamp: new Date().toISOString(), operation: 'create_plan', error: 'Duplicate key', status: 400 },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), operation: 'update_price', error: 'Invalid amount', status: 400 },
    ],
  });

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-6">Monetization Metrics</h2>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Active Plans</dt>
          <dd className="text-lg font-semibold text-gray-900">{metrics.activePlans} / {metrics.totalPlans}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Active Prices</dt>
          <dd className="text-lg font-semibold text-gray-900">{metrics.totalPrices}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Write Operations</dt>
          <dd className="text-lg font-semibold text-gray-900">{metrics.writeOperations}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Error Rate</dt>
          <dd className="text-lg font-semibold text-gray-900">{metrics.errorRate}%</dd>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Errors</h3>
        <div className="space-y-3">
          {metrics.recentErrors.map((error, idx) => (
            <div key={idx} className="border-l-4 border-red-400 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">{error.operation}</p>
                  <p className="text-sm text-red-700 mt-1">{error.error}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-600">{new Date(error.timestamp).toLocaleString()}</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mt-1">
                    {error.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


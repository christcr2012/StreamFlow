/**
 * Slow Query Monitoring Dashboard
 * 
 * Displays slow queries detected by Prisma middleware
 * Helps identify N+1 queries and performance bottlenecks
 */

'use client';

import { useState, useEffect } from 'react';

interface SlowQuery {
  model: string;
  action: string;
  duration: number;
  timestamp: string;
  count: number;
}

export default function SlowQueriesPage() {
  const [queries, setQueries] = useState<SlowQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(1000); // ms
  const [timeRange, setTimeRange] = useState('1h'); // 1h, 24h, 7d

  useEffect(() => {
    fetchSlowQueries();
  }, [threshold, timeRange]);

  const fetchSlowQueries = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/monitoring/slow-queries?threshold=${threshold}&range=${timeRange}`
      );
      const data = await response.json();
      setQueries(data.queries || []);
    } catch (error) {
      console.error('Error fetching slow queries:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Slow Query Monitoring</h1>
        <p className="text-gray-600">
          Monitor and analyze slow database queries to identify performance bottlenecks
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">
              Threshold (ms)
            </label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              <option value={500}>500ms</option>
              <option value={1000}>1000ms</option>
              <option value={2000}>2000ms</option>
              <option value={5000}>5000ms</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          <button
            onClick={fetchSlowQueries}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Slow Queries</div>
          <div className="text-2xl font-bold">{queries.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Avg Duration</div>
          <div className="text-2xl font-bold">
            {queries.length > 0
              ? Math.round(
                  queries.reduce((sum, q) => sum + q.duration, 0) / queries.length
                )
              : 0}
            ms
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Slowest Query</div>
          <div className="text-2xl font-bold">
            {queries.length > 0 ? Math.max(...queries.map((q) => q.duration)) : 0}ms
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Unique Models</div>
          <div className="text-2xl font-bold">
            {new Set(queries.map((q) => q.model)).size}
          </div>
        </div>
      </div>

      {/* Query List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Slow Queries</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : queries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No slow queries found in the selected time range
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Count
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Last Seen
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {queries.map((query, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{query.model}</td>
                    <td className="px-4 py-3 text-sm">{query.action}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {query.duration}ms
                    </td>
                    <td className="px-4 py-3 text-sm">{query.count}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(query.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          query.duration > 5000
                            ? 'bg-red-100 text-red-800'
                            : query.duration > 2000
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {query.duration > 5000
                          ? 'Critical'
                          : query.duration > 2000
                          ? 'Warning'
                          : 'Info'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {queries.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">💡 Optimization Recommendations</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Consider adding indexes for frequently queried fields</li>
            <li>Use select() to fetch only needed fields</li>
            <li>Implement pagination for large result sets</li>
            <li>Use include() carefully to avoid N+1 queries</li>
            <li>Consider caching frequently accessed data</li>
            <li>Review and optimize complex joins</li>
          </ul>
        </div>
      )}
    </div>
  );
}


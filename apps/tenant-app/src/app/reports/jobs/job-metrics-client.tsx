'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusBreakdown {
  status: string;
  count: number;
  percentage: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function JobMetricsClient() {
  const [totalJobs, setTotalJobs] = useState(0);
  const [completionRate, setCompletionRate] = useState('0');
  const [avgCompletionTime, setAvgCompletionTime] = useState('0');
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/jobs');
      const result = await res.json();
      setTotalJobs(result.totalJobs || 0);
      setCompletionRate(result.completionRate || '0');
      setAvgCompletionTime(result.avgCompletionTime || '0');
      setStatusBreakdown(result.statusBreakdown || []);
    } catch (error) {
      console.error('Error fetching job metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Status', 'Count', 'Percentage'],
      ...statusBreakdown.map(s => [s.status, s.count.toString(), s.percentage]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const chartData = statusBreakdown.map(item => ({
    name: item.status,
    value: item.count,
  }));

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Job Completion Metrics</h1>
          <p className="text-gray-600 mt-2">Track job completion rates and status breakdown</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-2xl font-bold">{totalJobs}</p>
            <p className="text-sm text-gray-600">Total Jobs</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-2xl font-bold">{avgCompletionTime} days</p>
            <p className="text-sm text-gray-600">Avg Completion Time</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Status Breakdown</h2>
            <button
              onClick={exportCSV}
              disabled={statusBreakdown.length === 0}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : statusBreakdown.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">No job data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {statusBreakdown.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium capitalize">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.count}</p>
                      <p className="text-sm text-gray-600">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


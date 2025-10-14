'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueData {
  date: string;
  revenue: number;
}

export default function RevenueReportClient() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [data, setData] = useState<RevenueData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/revenue?period=${period}`);
      const result = await res.json();
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Date', 'Revenue'],
      ...data.map(item => [item.date, item.revenue.toString()]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Trends</h1>
          <p className="text-gray-600 mt-2">Track revenue over time</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('daily')}
                className={`px-4 py-2 rounded ${period === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-4 py-2 rounded ${period === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-4 py-2 rounded ${period === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Monthly
              </button>
            </div>
            <button
              onClick={exportCSV}
              disabled={data.length === 0}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">No revenue data available</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-2xl font-bold">${total.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Revenue ({period})</p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


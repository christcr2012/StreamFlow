'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AgingData {
  bucket: string;
  amount: number;
}

export default function InvoiceAgingClient() {
  const [agingData, setAgingData] = useState<AgingData[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/invoices');
      const result = await res.json();
      setAgingData(result.agingData || []);
      setTotalOutstanding(result.totalOutstanding || 0);
      setInvoiceCount(result.invoiceCount || 0);
    } catch (error) {
      console.error('Error fetching invoice aging:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Aging Bucket', 'Amount'],
      ...agingData.map(item => [item.bucket, item.amount.toString()]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-aging-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Aging Report</h1>
          <p className="text-gray-600 mt-2">Track overdue invoices by aging buckets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-2xl font-bold">${totalOutstanding.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Outstanding</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-2xl font-bold">{invoiceCount}</p>
            <p className="text-sm text-gray-600">Unpaid Invoices</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Aging Breakdown</h2>
            <button
              onClick={exportCSV}
              disabled={agingData.length === 0}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : agingData.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">No invoice aging data available</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={agingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="amount" fill="#3b82f6" name="Amount" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                {agingData.map((item) => (
                  <div key={item.bucket} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{item.bucket}</span>
                    <span className="text-lg font-bold">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


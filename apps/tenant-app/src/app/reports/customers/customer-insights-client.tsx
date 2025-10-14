'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  revenue: number;
  invoiceCount: number;
}

export default function CustomerInsightsClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/customers');
      const result = await res.json();
      setCustomers(result.topCustomers || []);
      setTotalCustomers(result.totalCustomers || 0);
    } catch (error) {
      console.error('Error fetching customer insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Customer Name', 'Email', 'Revenue', 'Invoice Count'],
      ...customers.map(c => [c.name, c.email, c.revenue.toString(), c.invoiceCount.toString()]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-insights-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Customer Insights</h1>
          <p className="text-gray-600 mt-2">Top customers by revenue</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-2xl font-bold">{totalCustomers}</p>
              <p className="text-sm text-gray-600">Total Customers with Revenue</p>
            </div>
            <button
              onClick={exportCSV}
              disabled={customers.length === 0}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">No customer data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-right py-3 px-4">Revenue</th>
                    <th className="text-right py-3 px-4">Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">#{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{customer.name}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.email}</td>
                      <td className="py-3 px-4 text-right font-medium">${customer.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{customer.invoiceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  company: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
}

interface RecurringInvoice {
  id: string;
  customerId: string;
  frequency: string;
  intervalCount: number;
  startDate: string;
  endDate: string | null;
  nextInvoiceDate: string;
  active: boolean;
  items: any;
  terms: string | null;
  notes: string | null;
  currency: string;
  customer: Customer;
}

interface Props {
  recurringInvoices: RecurringInvoice[];
  customers: Customer[];
}

export default function RecurringInvoicesClient({ recurringInvoices, customers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleActive = async (id: string, currentActive: boolean) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/invoices/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!res.ok) throw new Error('Failed to update');
      router.refresh();
    } catch (error) {
      console.error('Error toggling recurring invoice:', error);
      alert('Failed to update recurring invoice');
    } finally {
      setLoading(null);
    }
  };

  const deleteRecurring = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring invoice?')) return;

    setLoading(id);
    try {
      const res = await fetch(`/api/invoices/recurring/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      router.refresh();
    } catch (error) {
      console.error('Error deleting recurring invoice:', error);
      alert('Failed to delete recurring invoice');
    } finally {
      setLoading(null);
    }
  };

  const getFrequencyLabel = (frequency: string, intervalCount: number) => {
    const base = frequency.charAt(0).toUpperCase() + frequency.slice(1);
    return intervalCount === 1 ? base : `Every ${intervalCount} ${base}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Invoices</h1>
        <Link
          href="/invoices/recurring/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Recurring Invoice
        </Link>
      </div>

      {recurringInvoices.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-4">No recurring invoices yet</p>
          <Link
            href="/invoices/recurring/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Your First Recurring Invoice
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recurringInvoices.map((ri) => (
                <tr key={ri.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{ri.customer.company || ri.customer.primaryName}</div>
                    {ri.customer.primaryEmail && (
                      <div className="text-sm text-gray-500">{ri.customer.primaryEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getFrequencyLabel(ri.frequency, ri.intervalCount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(ri.nextInvoiceDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ri.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ri.active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => toggleActive(ri.id, ri.active)}
                      disabled={loading === ri.id}
                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {ri.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => deleteRecurring(ri.id)}
                      disabled={loading === ri.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


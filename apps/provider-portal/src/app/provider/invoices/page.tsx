'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Invoice = {
  id: string;
  orgId: string;
  orgName: string;
  amountCents: number;
  status: string;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchInvoices in useCallback
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');

      const data = await res.json();
      setInvoices(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = invoices.filter((inv) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        inv.orgName.toLowerCase().includes(query) ||
        inv.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PAID: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      OVERDUE: 'bg-red-100 text-red-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      VOID: 'bg-gray-100 text-gray-500',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="container-responsive spacing-responsive-md">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Invoices
        </h1>
        <p className="text-responsive-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          View and manage all invoices across your organizations
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 premium-card spacing-responsive-sm">
        <div className="grid-responsive cols-sm-2 cols-lg-4">
          <div>
            <label htmlFor="search" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by org name or invoice ID..."
              className="input-field touch-target"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field touch-target"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DRAFT">Draft</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 sm:py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" style={{ borderColor: 'var(--brand-primary)', borderRightColor: 'transparent' }}></div>
          <p className="mt-2 text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>Loading invoices...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="premium-card spacing-responsive-sm" style={{ background: 'var(--surface-1)', border: '1px solid var(--accent-error)', color: 'var(--accent-error)' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredInvoices.length === 0 && (
        <div className="text-center py-8 sm:py-12" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-responsive-lg">No invoices found</p>
          <p className="mt-2 text-responsive-sm">
            {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Invoices will appear here once created'}
          </p>
        </div>
      )}

      {/* Invoice Table */}
      {!loading && !error && filteredInvoices.length > 0 && (
        <div className="table-responsive">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-primary)' }}>
            <thead style={{ background: 'var(--surface-1)' }}>
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Invoice ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Organization
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                  Issued
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                  Due
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ background: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="transition-colors" style={{ background: 'var(--bg-main)' }}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                    {invoice.id.substring(0, 8)}...
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                    {invoice.orgName}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(invoice.amountCents)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(invoice.issuedAt)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm hide-mobile" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(invoice.dueAt)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedInvoice(invoice.id)}
                      className="touch-target inline-flex items-center justify-center px-3 py-1.5 rounded-md transition-colors"
                      style={{ color: 'var(--brand-primary)', background: 'var(--surface-hover)' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoiceId={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

// Invoice Details Modal Component
function InvoiceDetailsModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchInvoiceDetails in useCallback
  const fetchInvoiceDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) throw new Error('Failed to fetch invoice details');
      const data = await res.json();
      setInvoice(data.invoice);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-responsive premium-card spacing-responsive-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-responsive-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Invoice Details
          </h2>
          <button
            onClick={onClose}
            className="touch-target p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--surface-hover)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" style={{ borderColor: 'var(--brand-primary)', borderRightColor: 'transparent' }}></div>
          </div>
        )}

        {!loading && invoice && (
          <div className="space-y-4">
            <div className="grid-responsive cols-sm-2">
              <div>
                <label className="block text-responsive-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Invoice ID</label>
                <p className="text-responsive-base font-mono" style={{ color: 'var(--text-primary)' }}>{invoice.id}</p>
              </div>
              <div>
                <label className="block text-responsive-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Organization</label>
                <p className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>{invoice.orgName}</p>
              </div>
              <div>
                <label className="block text-responsive-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Amount</label>
                <p className="text-responsive-base font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.amountCents)}</p>
              </div>
              <div>
                <label className="block text-responsive-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <p className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>{invoice.status}</p>
              </div>
            </div>

            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <div>
                <h3 className="text-responsive-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Line Items</h3>
                <div className="table-responsive">
                  <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                    <thead style={{ background: 'var(--surface-1)' }}>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Description</th>
                        <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Unit Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                      {invoice.lineItems.map((line: any) => (
                        <tr key={line.id}>
                          <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{line.description}</td>
                          <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{line.quantity}</td>
                          <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(line.unitPriceCents)}</td>
                          <td className="px-3 py-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(line.amountCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary touch-target-comfortable flex-1 justify-center text-center"
              >
                Download PDF
              </a>
              <button
                onClick={onClose}
                className="btn-primary touch-target-comfortable flex-1 justify-center"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


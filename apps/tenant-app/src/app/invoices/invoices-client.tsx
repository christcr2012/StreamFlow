'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveTable } from '@/components/responsive-table';
import { Badge } from '@/components/ui/badge';
import { PullToRefreshIndicator } from '@/components/pull-to-refresh-indicator';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useHapticFeedback, getHapticClasses } from '@/hooks/use-haptic-feedback';
import { showToast } from '@/components/ui/toast';
import Link from 'next/link';

interface Invoice {
  id: string;
  number: string | null;
  amount: any;
  status: string;
  issuedAt: Date;
  customer: {
    id: string;
    company: string | null;
    primaryName: string | null;
  } | null;
}

interface InvoicesClientProps {
  invoices: Invoice[];
}

export function InvoicesClient({ invoices: initialInvoices }: InvoicesClientProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);

  // Haptic feedback
  const { triggerHaptic } = useHapticFeedback();

  // Pull-to-refresh
  const handleRefresh = async () => {
    triggerHaptic('medium');
    router.refresh();
  };

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: true,
  });

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      triggerHaptic('heavy');
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      // Remove invoice from local state
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
      triggerHaptic('success');
      showToast('Invoice deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      triggerHaptic('error');
      showToast('Failed to delete invoice', 'error');
    }
  };

  const columns = [
    {
      key: 'number',
      label: 'Invoice',
      render: (invoice: Invoice) => (
        <Link 
          href={`/invoices/${invoice.id}`} 
          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {invoice.number || 'Draft'}
        </Link>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (invoice: Invoice) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {invoice.Customer?.company || invoice.Customer?.primaryName || 'No customer'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (invoice: Invoice) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          ${(Number(invoice.amount) / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (invoice: Invoice) => (
        <Badge variant={
          invoice.status === 'paid' ? 'success' :
          invoice.status === 'open' ? 'warning' : 'default'
        }>
          {invoice.status}
        </Badge>
      ),
    },
    {
      key: 'issuedAt',
      label: 'Date',
      render: (invoice: Invoice) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(invoice.issuedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Pull-to-Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullToRefresh.pullDistance}
        threshold={pullToRefresh.threshold}
        isRefreshing={pullToRefresh.isRefreshing}
        isPulling={pullToRefresh.isPulling}
      />

      <ResponsiveTable
        data={invoices}
        columns={columns}
        keyExtractor={(invoice) => invoice.id}
        onRowClick={(invoice) => router.push(`/invoices/${invoice.id}`)}
        onDelete={(invoice) => handleDeleteInvoice(invoice.id)}
        deleteLabel="Delete Invoice"
        emptyMessage={
          <>
            No invoices yet. <Link href="/invoices/new" className="text-blue-600 dark:text-blue-400">Create your first invoice</Link>
          </>
        }
      />
    </>
  );
}


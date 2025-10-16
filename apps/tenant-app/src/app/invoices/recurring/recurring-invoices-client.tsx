'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResponsiveTable } from '@/components/responsive-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@cortiware/ui';
import { PullToRefreshIndicator } from '@/components/pull-to-refresh-indicator';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useHapticFeedback, getHapticClasses } from '@/hooks/use-haptic-feedback';
import { showToast } from '@/components/ui/toast';

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

export default function RecurringInvoicesClient({ recurringInvoices: initialRecurringInvoices, customers }: Props) {
  const router = useRouter();
  const [recurringInvoices, setRecurringInvoices] = useState(initialRecurringInvoices);
  const [loading, setLoading] = useState<string | null>(null);

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
    setLoading(id);
    try {
      triggerHaptic('heavy');
      const res = await fetch(`/api/invoices/recurring/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      // Remove from local state
      setRecurringInvoices((prev) => prev.filter((ri) => ri.id !== id));
      triggerHaptic('success');
      showToast('Recurring invoice deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting recurring invoice:', error);
      triggerHaptic('error');
      showToast('Failed to delete recurring invoice', 'error');
    } finally {
      setLoading(null);
    }
  };

  const getFrequencyLabel = (frequency: string, intervalCount: number) => {
    const base = frequency.charAt(0).toUpperCase() + frequency.slice(1);
    return intervalCount === 1 ? base : `Every ${intervalCount} ${base}`;
  };

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (ri: RecurringInvoice) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {ri.customer.company || ri.customer.primaryName}
          </div>
          {ri.customer.primaryEmail && (
            <div className="text-sm text-gray-500 dark:text-gray-400">{ri.customer.primaryEmail}</div>
          )}
        </div>
      ),
    },
    {
      key: 'frequency',
      label: 'Frequency',
      render: (ri: RecurringInvoice) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {getFrequencyLabel(ri.frequency, ri.intervalCount)}
        </span>
      ),
    },
    {
      key: 'nextInvoiceDate',
      label: 'Next Invoice',
      render: (ri: RecurringInvoice) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(ri.nextInvoiceDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (ri: RecurringInvoice) => (
        <Badge variant={ri.active ? 'success' : 'default'}>
          {ri.active ? 'Active' : 'Paused'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (ri: RecurringInvoice) => (
        <div className="flex flex-col md:flex-row gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              toggleActive(ri.id, ri.active);
            }}
            disabled={loading === ri.id}

          >
            {ri.active ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              deleteRecurring(ri.id);
            }}
            disabled={loading === ri.id}

          >
            Delete
          </Button>
        </div>
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

      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recurring Invoices</h1>
          <Link href="/invoices/recurring/new">
            <Button className={`w-full md:w-auto ${getHapticClasses('medium')}`}>
              Create Recurring Invoice
            </Button>
          </Link>
        </div>

        {recurringInvoices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No recurring invoices yet</p>
            <Link href="/invoices/recurring/new">
              <Button className={getHapticClasses('medium')}>
                Create Your First Recurring Invoice
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-4">
            <ResponsiveTable
              data={recurringInvoices}
              columns={columns}
              keyExtractor={(ri) => ri.id}
              onDelete={(ri) => deleteRecurring(ri.id)}
              deleteLabel="Delete Recurring Invoice"
              emptyMessage="No recurring invoices found."
            />
          </div>
        )}
      </div>
    </>
  );
}


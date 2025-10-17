'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveTable } from '@/components/responsive-table';
import { Button } from '@cortiware/ui';
import { Input } from '@cortiware/ui';
import { Badge } from '@/components/ui/badge';
import { Card } from '@cortiware/ui';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { SwipeableListItem } from '@/components/swipeable-list-item';
import { PullToRefreshIndicator } from '@/components/pull-to-refresh-indicator';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useHapticFeedback, getHapticClasses } from '@/hooks/use-haptic-feedback';
import Link from 'next/link';

interface Customer {
  id: string;
  company: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  createdAt: Date;
  _count: {
    Job: number;
    Invoice: number;
  };
}

interface CustomersClientProps {
  customers: Customer[];
}

export function CustomersClient({ customers: initialCustomers }: CustomersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState(initialCustomers);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [useInfiniteScrollMode, setUseInfiniteScrollMode] = useState(false);
  const itemsPerPage = 20;

  // Haptic feedback
  const { triggerHaptic } = useHapticFeedback();

  // Pull-to-refresh
  const handleRefresh = async () => {
    triggerHaptic('medium');
    // Refresh data by reloading the page
    router.refresh();
  };

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: true,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (currentPage !== 1) params.set('page', currentPage.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : '/customers';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, sortBy, sortOrder, currentPage, router]);

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter((customer) => {
      const query = searchQuery.toLowerCase();
      return (
        customer.company?.toLowerCase().includes(query) ||
        customer.primaryName?.toLowerCase().includes(query) ||
        customer.primaryEmail?.toLowerCase().includes(query)
      );
    });

    // Sort customers
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'name':
          aVal = (a.company || a.primaryName || '').toLowerCase();
          bVal = (b.company || b.primaryName || '').toLowerCase();
          break;
        case 'jobs':
          aVal = a._count.Job;
          bVal = b._count.Job;
          break;
        case 'invoices':
          aVal = a._count.Invoice;
          bVal = b._count.Invoice;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [customers, searchQuery, sortBy, sortOrder]);

  // Infinite scroll
  const infiniteScroll = useInfiniteScroll({
    items: filteredAndSortedCustomers,
    itemsPerPage,
    enabled: useInfiniteScrollMode,
  });

  // Pagination (traditional)
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    if (useInfiniteScrollMode) {
      return infiniteScroll.displayedItems;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedCustomers.slice(startIndex, endIndex);
  }, [filteredAndSortedCustomers, currentPage, itemsPerPage, useInfiniteScrollMode, infiniteScroll.displayedItems]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete customer
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      triggerHaptic('heavy');
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      // Remove customer from local state
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      triggerHaptic('success');
    } catch (error) {
      console.error('Error deleting customer:', error);
      triggerHaptic('error');
      alert('Failed to delete customer. Please try again.');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (customer: Customer) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {customer.company || customer.primaryName || 'Unnamed Customer'}
          </p>
          {customer.company && customer.primaryName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{customer.primaryName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (customer: Customer) => (
        <div className="text-sm">
          {customer.primaryEmail && (
            <p className="text-gray-900 dark:text-gray-100">{customer.primaryEmail}</p>
          )}
          {customer.primaryPhone && (
            <p className="text-gray-500 dark:text-gray-400">{customer.primaryPhone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'jobs',
      label: 'Jobs',
      render: (customer: Customer) => (
        <Badge variant="info" size="sm">
          {customer._count.Job}
        </Badge>
      ),
    },
    {
      key: 'invoices',
      label: 'Invoices',
      render: (customer: Customer) => (
        <Badge variant="default" size="sm">
          {customer._count.Invoice}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (customer: Customer) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(customer.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Company', 'Email', 'Phone', 'Jobs', 'Invoices', 'Created'],
      ...filteredAndSortedCustomers.map(c => [
        c.primaryName || '',
        c.company || '',
        c.primaryEmail || '',
        c.primaryPhone || '',
        c._count.Job.toString(),
        c._count.Invoice.toString(),
        new Date(c.createdAt).toLocaleDateString(),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Pull-to-Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullToRefresh.pullDistance}
        threshold={pullToRefresh.threshold}
        isRefreshing={pullToRefresh.isRefreshing}
        isPulling={pullToRefresh.isPulling}
      />

      <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
                {filteredAndSortedCustomers.length} of {customers.length} customers
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className={`flex-1 md:flex-none ${getHapticClasses('light')}`}

              >
                Export CSV
              </Button>
              <Link href="/customers/new" className="flex-1 md:flex-none">
                <Button className={`w-full ${getHapticClasses('medium')}`}>+ New Customer</Button>
              </Link>
            </div>
          </div>

        {/* Search and Filters */}
        <Card>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="search"
                  placeholder="Search customers by name, company, or email..."
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                  fullWidth
                />
              </div>
              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'createdAt', label: 'Date Created' },
                  { value: 'name', label: 'Name' },
                  { value: 'jobs', label: 'Job Count' },
                  { value: 'invoices', label: 'Invoice Count' },
                ]}
                fullWidth
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </div>
        </Card>

        {/* Table */}
        <Card padding="none">
          <div className="p-4">
            <ResponsiveTable
              data={paginatedCustomers}
              columns={columns}
              keyExtractor={(customer) => customer.id}
              onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
              onDelete={(customer) => handleDeleteCustomer(customer.id)}
              deleteLabel="Delete Customer"
              emptyMessage="No customers found. Create your first customer to get started."
            />
          </div>
          {!useInfiniteScrollMode && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredAndSortedCustomers.length}
              itemsPerPage={itemsPerPage}
            />
          )}
          {useInfiniteScrollMode && infiniteScroll.hasMore && (
            <div ref={infiniteScroll.observerTarget} className="p-4 text-center">
              {infiniteScroll.isLoading ? (
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading more...</span>
                </div>
              ) : (
                <button
                  onClick={infiniteScroll.loadMore}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
    </>
  );
}


'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveTable } from '@/components/responsive-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import Link from 'next/link';

interface Customer {
  id: string;
  company: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  createdAt: Date;
  _count: {
    jobs: number;
    invoices: number;
  };
}

interface CustomersClientProps {
  customers: Customer[];
}

export function CustomersClient({ customers }: CustomersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const itemsPerPage = 20;

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
          aVal = a._count.jobs;
          bVal = b._count.jobs;
          break;
        case 'invoices':
          aVal = a._count.invoices;
          bVal = b._count.invoices;
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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedCustomers.slice(startIndex, endIndex);
  }, [filteredAndSortedCustomers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          {customer._count.jobs}
        </Badge>
      ),
    },
    {
      key: 'invoices',
      label: 'Invoices',
      render: (customer: Customer) => (
        <Badge variant="default" size="sm">
          {customer._count.invoices}
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
        c._count.jobs.toString(),
        c._count.invoices.toString(),
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
              className="flex-1 md:flex-none"
              style={{ minHeight: '44px' }}
            >
              Export CSV
            </Button>
            <Link href="/customers/new" className="flex-1 md:flex-none">
              <Button className="w-full" style={{ minHeight: '44px' }}>+ New Customer</Button>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              emptyMessage="No customers found. Create your first customer to get started."
            />
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredAndSortedCustomers.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </Card>
      </div>
    </div>
  );
}


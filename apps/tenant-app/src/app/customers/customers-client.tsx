'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
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

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);

    const newUrl = params.toString() ? `?${params.toString()}` : '/customers';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, sortBy, sortOrder, router]);

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

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      render: (customer) => (
        <div>
          <p className="font-medium text-gray-900">
            {customer.company || customer.primaryName || 'Unnamed Customer'}
          </p>
          {customer.company && customer.primaryName && (
            <p className="text-sm text-gray-500">{customer.primaryName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (customer) => (
        <div className="text-sm">
          {customer.primaryEmail && (
            <p className="text-gray-900">{customer.primaryEmail}</p>
          )}
          {customer.primaryPhone && (
            <p className="text-gray-500">{customer.primaryPhone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'jobs',
      header: 'Jobs',
      sortable: true,
      render: (customer) => (
        <Badge variant="info" size="sm">
          {customer._count.jobs}
        </Badge>
      ),
    },
    {
      key: 'invoices',
      header: 'Invoices',
      sortable: true,
      render: (customer) => (
        <Badge variant="default" size="sm">
          {customer._count.invoices}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (customer) => (
        <span className="text-sm text-gray-500">
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">
              {filteredAndSortedCustomers.length} of {customers.length} customers
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Link href="/customers/new">
              <Button>+ New Customer</Button>
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
          <DataTable
            data={filteredAndSortedCustomers}
            columns={columns}
            keyExtractor={(customer) => customer.id}
            onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
            emptyMessage="No customers found. Create your first customer to get started."
          />
        </Card>
      </div>
    </div>
  );
}


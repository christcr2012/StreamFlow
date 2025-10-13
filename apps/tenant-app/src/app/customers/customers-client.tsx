'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.company?.toLowerCase().includes(query) ||
      customer.primaryName?.toLowerCase().includes(query) ||
      customer.primaryEmail?.toLowerCase().includes(query)
    );
  });

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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">
              Manage your customer relationships
            </p>
          </div>
          <Link href="/customers/new">
            <Button>+ New Customer</Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="p-4">
            <Input
              type="search"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </div>
        </Card>

        {/* Table */}
        <Card padding="none">
          <DataTable
            data={filteredCustomers}
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


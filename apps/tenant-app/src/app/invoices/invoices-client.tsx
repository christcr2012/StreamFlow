'use client';

import { useRouter } from 'next/navigation';
import { ResponsiveTable } from '@/components/responsive-table';
import { Badge } from '@/components/ui/badge';
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

export function InvoicesClient({ invoices }: InvoicesClientProps) {
  const router = useRouter();

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
          {invoice.customer?.company || invoice.customer?.primaryName || 'No customer'}
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
    <ResponsiveTable
      data={invoices}
      columns={columns}
      keyExtractor={(invoice) => invoice.id}
      onRowClick={(invoice) => router.push(`/invoices/${invoice.id}`)}
      emptyMessage={
        <>
          No invoices yet. <Link href="/invoices/new" className="text-blue-600 dark:text-blue-400">Create your first invoice</Link>
        </>
      }
    />
  );
}


'use client';

import { useRouter } from 'next/navigation';
import { useSSE } from '@/hooks/use-sse';
import { showToast } from '@/components/ui/toast';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface DashboardClientProps {
  stats: {
    totalCustomers: number;
    totalJobs: number;
    activeJobs: number;
    totalInvoices: number;
    unpaidInvoices: number;
  };
  recentJobs: Array<{
    id: string;
    title: string;
    status: string;
    scheduledAt: Date | null;
    customer: {
      id: string;
      company: string | null;
      primaryName: string | null;
    } | null;
  }>;
  recentInvoices: Array<{
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
  }>;
}

export function DashboardClient({ stats, recentJobs, recentInvoices }: DashboardClientProps) {
  const router = useRouter();

  // Set up SSE for real-time updates
  useSSE({
    onJobUpdated: (data) => {
      showToast(`Job "${data.title}" status updated to ${data.status}`, 'info');
      router.refresh(); // Refresh server component data
    },
    onInvoiceUpdated: (data) => {
      showToast(`Invoice ${data.number || 'Draft'} status updated to ${data.status}`, 'info');
      router.refresh();
    },
    onPaymentReceived: (data) => {
      showToast(
        `Payment received: $${(data.paymentAmount / 100).toFixed(2)} for invoice ${data.invoiceNumber || 'Draft'}`,
        'success'
      );
      router.refresh();
    },
  });

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCustomers}</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.activeJobs}</p>
              <p className="text-xs text-gray-500 mt-1">of {stats.totalJobs} total</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-500">Unpaid Invoices</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.unpaidInvoices}</p>
              <p className="text-xs text-gray-500 mt-1">of {stats.totalInvoices} total</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-500">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInvoices}</p>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <Card>
            <CardHeader
              title="Recent Jobs"
              action={
                <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              }
            />
            <div className="divide-y divide-gray-200">
              {recentJobs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No jobs yet. <Link href="/jobs/new" className="text-blue-600">Create your first job</Link>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{job.title}</p>
                        {job.customer && (
                          <p className="text-sm text-gray-500">
                            {job.customer.company || job.customer.primaryName}
                          </p>
                        )}
                        {job.scheduledAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(job.scheduledAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          job.status === 'completed' ? 'success' :
                          job.status === 'in-progress' ? 'info' :
                          job.status === 'cancelled' ? 'danger' : 'default'
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader
              title="Recent Invoices"
              action={
                <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              }
            />
            <div className="divide-y divide-gray-200">
              {recentInvoices.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No invoices yet. <Link href="/invoices/new" className="text-blue-600">Create your first invoice</Link>
                </div>
              ) : (
                recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {invoice.number || 'Draft'}
                        </p>
                        {invoice.customer && (
                          <p className="text-sm text-gray-500">
                            {invoice.customer.company || invoice.customer.primaryName}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(invoice.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${(Number(invoice.amount) / 100).toFixed(2)}
                        </p>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'success' :
                            invoice.status === 'open' ? 'warning' : 'default'
                          }
                          size="sm"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader title="Quick Actions" />
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/customers/new"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">👤</div>
              <p className="text-sm font-medium text-gray-900">New Customer</p>
            </Link>
            <Link
              href="/jobs/new"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-sm font-medium text-gray-900">New Job</p>
            </Link>
            <Link
              href="/invoices/new"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📄</div>
              <p className="text-sm font-medium text-gray-900">New Invoice</p>
            </Link>
            <Link
              href="/agreements"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📝</div>
              <p className="text-sm font-medium text-gray-900">Agreements</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}


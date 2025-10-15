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
    paidInvoices: number;
    totalRevenue: number;
    unpaidAmount: number;
    totalInvoiceAmount: number;
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
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Revenue Card */}
          <Card>
            <div className="p-4 md:p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-500 mt-2">
                ${(stats.totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.paidInvoices} paid invoice{stats.paidInvoices !== 1 ? 's' : ''}
              </p>
            </div>
          </Card>

          {/* Unpaid Amount Card */}
          <Card>
            <div className="p-4 md:p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unpaid Amount</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-500 mt-2">
                ${(stats.unpaidAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.unpaidInvoices} unpaid invoice{stats.unpaidInvoices !== 1 ? 's' : ''}
              </p>
            </div>
          </Card>

          {/* Active Jobs Card */}
          <Card>
            <div className="p-4 md:p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-500 mt-2">{stats.activeJobs}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">of {stats.totalJobs} total</p>
            </div>
          </Card>

          {/* Total Customers Card */}
          <Card>
            <div className="p-4 md:p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.totalCustomers}</p>
              <Link href="/customers" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1 inline-block">
                View all →
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Jobs */}
          <Card>
            <CardHeader
              title="Recent Jobs"
              action={
                <Link href="/jobs" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  View all
                </Link>
              }
            />
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentJobs.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No jobs yet. <Link href="/jobs/new" className="text-blue-600 dark:text-blue-400">Create your first job</Link>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{job.title}</p>
                        {job.customer && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {job.customer.company || job.customer.primaryName}
                          </p>
                        )}
                        {job.scheduledAt && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
                <Link href="/invoices" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  View all
                </Link>
              }
            />
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentInvoices.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No invoices yet. <Link href="/invoices/new" className="text-blue-600 dark:text-blue-400">Create your first invoice</Link>
                </div>
              ) : (
                recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {invoice.number || 'Draft'}
                        </p>
                        {invoice.customer && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {invoice.customer.company || invoice.customer.primaryName}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(invoice.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
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
          <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Link
              href="/customers/new"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
              style={{ minHeight: '88px' }}
            >
              <div className="text-2xl mb-2">👤</div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New Customer</p>
            </Link>
            <Link
              href="/jobs/new"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
              style={{ minHeight: '88px' }}
            >
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New Job</p>
            </Link>
            <Link
              href="/invoices/new"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
              style={{ minHeight: '88px' }}
            >
              <div className="text-2xl mb-2">📄</div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New Invoice</p>
            </Link>
            <Link
              href="/agreements"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
              style={{ minHeight: '88px' }}
            >
              <div className="text-2xl mb-2">📝</div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Agreements</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}


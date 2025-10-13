import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

async function getDashboardData(orgId: string) {
  const [
    totalCustomers,
    totalJobs,
    activeJobs,
    totalInvoices,
    unpaidInvoices,
    recentJobs,
    recentInvoices,
  ] = await Promise.all([
    prisma.customer.count({ where: { orgId } }),
    prisma.job.count({ where: { orgId } }),
    prisma.job.count({ where: { orgId, status: 'in-progress' } }),
    prisma.invoice.count({ where: { orgId } }),
    prisma.invoice.count({ where: { orgId, status: { in: ['draft', 'open'] } } }),
    prisma.job.findMany({
      where: { orgId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { orgId },
      include: { customer: true },
      orderBy: { issuedAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    stats: {
      totalCustomers,
      totalJobs,
      activeJobs,
      totalInvoices,
      unpaidInvoices,
    },
    recentJobs,
    recentInvoices,
  };
}

export default async function DashboardPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated) {
    redirect('/login');
  }

  if (!authContext.orgId) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">No organization found for this user.</p>
          </div>
        </div>
      </div>
    );
  }

  const data = await getDashboardData(authContext.orgId);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {authContext.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{data.stats.totalCustomers}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <Link href="/customers" className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block">
                View all →
              </Link>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{data.stats.activeJobs}</p>
                  <p className="text-xs text-gray-500 mt-1">of {data.stats.totalJobs} total</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <Link href="/jobs" className="text-sm text-green-600 hover:text-green-700 mt-4 inline-block">
                View all →
              </Link>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unpaid Invoices</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{data.stats.unpaidInvoices}</p>
                  <p className="text-xs text-gray-500 mt-1">of {data.stats.totalInvoices} total</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <Link href="/invoices" className="text-sm text-yellow-600 hover:text-yellow-700 mt-4 inline-block">
                View all →
              </Link>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quick Actions</p>
                  <div className="mt-3 space-y-2">
                    <Link href="/jobs/new" className="block text-sm text-blue-600 hover:text-blue-700">
                      + New Job
                    </Link>
                    <Link href="/invoices/new" className="block text-sm text-blue-600 hover:text-blue-700">
                      + New Invoice
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <Card>
            <CardHeader title="Recent Jobs" />
            <div className="divide-y divide-gray-200">
              {data.recentJobs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No jobs yet. <Link href="/jobs/new" className="text-blue-600 hover:text-blue-700">Create your first job</Link>
                </div>
              ) : (
                data.recentJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {job.customer?.company || job.customer?.primaryName || 'No customer'}
                        </p>
                      </div>
                      <Badge variant={
                        job.status === 'completed' ? 'success' :
                        job.status === 'in-progress' ? 'info' :
                        job.status === 'cancelled' ? 'danger' : 'default'
                      }>
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
            <CardHeader title="Recent Invoices" />
            <div className="divide-y divide-gray-200">
              {data.recentInvoices.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No invoices yet. <Link href="/invoices/new" className="text-blue-600 hover:text-blue-700">Create your first invoice</Link>
                </div>
              ) : (
                data.recentInvoices.map((invoice) => (
                  <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="block p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{invoice.number}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {invoice.customer?.company || invoice.customer?.primaryName || 'No customer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${(Number(invoice.amount) / 100).toFixed(2)}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'open' ? 'warning' : 'default'
                        } size="sm">
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
      </div>
    </div>
  );
}


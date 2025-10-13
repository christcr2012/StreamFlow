import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './dashboard-client';

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

  return <DashboardClient {...data} />;
}


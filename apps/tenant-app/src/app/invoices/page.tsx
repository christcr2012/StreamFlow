import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card } from '@cortiware/ui';
import { Button } from '@cortiware/ui';
import Link from 'next/link';
import { InvoicesClient } from './invoices-client';

async function getInvoices(orgId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { orgId },
    include: {
      customer: {
        select: { id: true, company: true, primaryName: true },
      },
    },
    orderBy: { issuedAt: 'desc' },
    take: 100,
  });

  return invoices;
}

export default async function InvoicesPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  const invoices = await getInvoices(authContext.orgId);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">Manage your invoices and payments</p>
          </div>
          <Link href="/invoices/new">
            <Button className="w-full md:w-auto">+ New Invoice</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {invoices.filter((i: any) => i.status === 'draft').length}
              </p>
              <p className="text-sm text-gray-600">Draft</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {invoices.filter((i: any) => i.status === 'open').length}
              </p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {invoices.filter((i: any) => i.status === 'paid').length}
              </p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${invoices.reduce((sum: any, i: any) => sum + Number(i.amount), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </Card>
        </div>

        <Card padding="none">
          <div className="p-4">
            <InvoicesClient invoices={invoices} />
          </div>
        </Card>
      </div>
    </div>
  );
}


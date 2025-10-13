import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">Manage your invoices and payments</p>
          </div>
          <Link href="/invoices/new">
            <Button>+ New Invoice</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {invoices.filter(i => i.status === 'draft').length}
              </p>
              <p className="text-sm text-gray-600">Draft</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {invoices.filter(i => i.status === 'open').length}
              </p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {invoices.filter(i => i.status === 'paid').length}
              </p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${invoices.reduce((sum, i) => sum + Number(i.amount), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </Card>
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No invoices yet. <Link href="/invoices/new" className="text-blue-600">Create your first invoice</Link>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/invoices/${invoice.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {invoice.number || 'Draft'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.customer?.company || invoice.customer?.primaryName || 'No customer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(Number(invoice.amount) / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'open' ? 'warning' : 'default'
                        }>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.issuedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}


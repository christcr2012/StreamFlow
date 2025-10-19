import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card } from '@cortiware/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@cortiware/ui';
import Link from 'next/link';

async function getAgreements(orgId: string) {
  const agreements = await prisma.agreement.findMany({
    where: { orgId },
    include: { Customer: {
        select: { id: true, company: true, primaryName: true },
      },
      AgreementTemplate: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return agreements;
}

export default async function AgreementsPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  const agreements = await getAgreements(authContext.orgId);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agreements</h1>
            <p className="text-gray-600 mt-1">Manage customer agreements and contracts</p>
          </div>
          <Button>+ New Agreement</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {agreements.filter((a: { status: string }) => a.status === 'draft').length}
              </p>
              <p className="text-sm text-gray-600">Draft</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {agreements.filter((a: { status: string }) => a.status === 'sent').length}
              </p>
              <p className="text-sm text-gray-600">Sent</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {agreements.filter((a: { status: string }) => a.status === 'signed').length}
              </p>
              <p className="text-sm text-gray-600">Signed</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {agreements.length}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agreements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No agreements yet. Create your first agreement to get started.
                    </td>
                  </tr>
                ) : (
                  agreements.map((agreement: any) => (
                    <tr key={agreement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Link href={`/customers/${agreement.Customer.id}`} className="text-blue-600 hover:text-blue-700">
                          {agreement.Customer.company || agreement.Customer.primaryName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agreement.AgreementTemplate.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          agreement.status === 'signed' ? 'success' :
                          agreement.status === 'sent' ? 'info' : 'default'
                        }>
                          {agreement.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agreement.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agreement.signedAt ? new Date(agreement.signedAt).toLocaleDateString() : '-'}
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


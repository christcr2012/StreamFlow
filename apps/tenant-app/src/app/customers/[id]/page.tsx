import { getAuthContext } from '@/lib/auth-context';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CustomerDetailClient } from './customer-detail-client';

async function getCustomer(id: string, orgId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, orgId },
    include: { CustomerContact: true,
      Job: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      Invoice: {
        orderBy: { issuedAt: 'desc' },
        take: 10,
      },
    },
  });

  return customer;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;
  const customer = await getCustomer(id, authContext.orgId);

  if (!customer) {
    notFound();
  }

  return <CustomerDetailClient customer={customer} />;
}


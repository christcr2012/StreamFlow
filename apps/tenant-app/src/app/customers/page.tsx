import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CustomersClient } from './customers-client';

async function getCustomers(orgId: string) {
  const customers = await prisma.customer.findMany({
    where: { orgId },
    include: {
      _count: { select: { Job: true,
          Invoice: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return customers;
}

export default async function CustomersPage() {
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

  const customers = await getCustomers(authContext.orgId);

  return <CustomersClient customers={customers} />;
}


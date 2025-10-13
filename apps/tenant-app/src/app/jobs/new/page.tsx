import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { NewJobClient } from './new-job-client';

async function getCustomers(orgId: string) {
  const customers = await prisma.customer.findMany({
    where: { orgId },
    select: {
      id: true,
      company: true,
      primaryName: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return customers;
}

export default async function NewJobPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  const customers = await getCustomers(authContext.orgId);

  return <NewJobClient customers={customers} />;
}


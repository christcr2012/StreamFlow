import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { NewInvoiceClient } from './new-invoice-client';

async function getCustomersAndJobs(orgId: string) {
  const [customers, jobs] = await Promise.all([
    prisma.customer.findMany({
      where: { orgId },
      select: {
        id: true,
        company: true,
        primaryName: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.job.findMany({
      where: { orgId },
      select: {
        id: true,
        title: true,
        customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  return { customers, jobs };
}

export default async function NewInvoicePage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  const data = await getCustomersAndJobs(authContext.orgId);

  return <NewInvoiceClient {...data} />;
}


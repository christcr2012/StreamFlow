import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { JobsClient } from './jobs-client';

async function getJobs(orgId: string) {
  const jobs = await prisma.job.findMany({
    where: { orgId },
    include: {
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
  });

  return jobs;
}

export default async function JobsPage() {
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

  const jobs = await getJobs(authContext.orgId);

  return <JobsClient jobs={jobs} />;
}


import { getAuthContext } from '@/lib/auth-context';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { JobDetailClient } from './job-detail-client';

async function getJob(id: string, orgId: string) {
  const job = await prisma.job.findFirst({
    where: { id, orgId },
    include: {
      customer: true,
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
      photos: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return job;
}

export default async function JobDetailPage({
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
  const job = await getJob(id, authContext.orgId);

  if (!job) {
    notFound();
  }

  return <JobDetailClient job={job} />;
}


import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
      where: { orgId: authContext.orgId },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    jobs.forEach((job: any) => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });

    // Calculate completion rate
    const completedCount = statusCounts['completed'] || 0;
    const totalCount = jobs.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Calculate average completion time for completed jobs
    const completedJobs = jobs.filter((job: any) => job.status === 'completed');
    let avgCompletionTime = 0;

    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum: any, job: any) => {
        const created = new Date(job.createdAt).getTime();
        const updated = new Date(job.updatedAt).getTime();
        return sum + (updated - created);
      }, 0);

      avgCompletionTime = totalTime / completedJobs.length / (1000 * 60 * 60 * 24); // Convert to days
    }

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / totalCount) * 100).toFixed(1),
    }));

    return NextResponse.json({
      totalJobs: totalCount,
      completionRate: completionRate.toFixed(1),
      avgCompletionTime: avgCompletionTime.toFixed(1),
      statusBreakdown,
    });
  } catch (error) {
    console.error('Error fetching job metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


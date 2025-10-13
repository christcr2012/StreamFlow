import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { UpdateJobStatusSchema } from '@/lib/validations/job';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = UpdateJobStatusSchema.parse(body);

    const job = await prisma.job.update({
      where: { id, orgId: authContext.orgId! },
      data: {
        status: data.status,
        completedAt: data.status === 'completed' ? new Date() : undefined,
        timeline: {
          create: {
            eventType: 'status_changed',
            description: `Status changed to ${data.status}`,
            metadata: { note: data.note || '' },
            userId: authContext.userId,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, job });
  } catch (error: any) {
    console.error('POST /api/jobs/[id]/status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


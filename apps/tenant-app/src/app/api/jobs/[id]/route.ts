import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { UpdateJobSchema } from '@/lib/validations/job';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, orgId: authContext.orgId! },
      include: { Customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
            primaryEmail: true,
            primaryPhone: true,
          },
        },
        JobPhoto: {
          select: {
            id: true,
            publicId: true,
            url: true,
            caption: true,
            takenAt: true,
          },
          orderBy: { takenAt: 'desc' },
        },
        JobTimeline: {
          select: {
            id: true,
            publicId: true,
            eventType: true,
            description: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('GET /api/jobs/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const data = UpdateJobSchema.parse(body);

    const job = await prisma.job.update({
      where: { id, orgId: authContext.orgId! },
      data: {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
      include: { Customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
            primaryEmail: true,
            primaryPhone: true,
          },
        },
      },
    });

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('PATCH /api/jobs/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.job.delete({
      where: { id, orgId: authContext.orgId! },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE /api/jobs/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


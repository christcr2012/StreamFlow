import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { CreateJobSchema, JobFilterSchema } from '@/lib/validations/job';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const filter = JobFilterSchema.parse(params);

    const where: any = { orgId: authContext.orgId };
    
    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter.from || filter.to) {
      where.scheduledAt = {};
      if (filter.from) where.scheduledAt.gte = new Date(filter.from);
      if (filter.to) where.scheduledAt.lte = new Date(filter.to);
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: { Customer: {
            select: { id: true, company: true, primaryName: true },
          },
          _count: { select: { JobPhoto: true, JobTimeline: true },
          },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      items,
      page: filter.page,
      limit: filter.limit,
      total,
      pages: Math.ceil(total / filter.limit),
    });
  } catch (error: any) {
    console.error('GET /api/jobs error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = CreateJobSchema.parse(body);

    const job = await prisma.job.create({
      data: {
        ...data,
        orgId: authContext.orgId!,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        location: data.location || undefined,
        JobTimeline: {
          create: {
            publicId: `timeline_${nanoid(12)}`,
            eventType: 'created',
            description: 'Job created',
            metadata: {},
            userId: authContext.userId,
          },
        },
      },
      include: { Customer: true,
      },
    });

    return NextResponse.json({ id: job.id, job }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/jobs error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


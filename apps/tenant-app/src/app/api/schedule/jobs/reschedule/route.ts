// apps/tenant-app/src/app/api/schedule/jobs/reschedule/route.ts
// POST /api/schedule/jobs/reschedule - Reschedule job to new time

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, scheduledStart, scheduledEnd } = body;

    if (!jobId || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: 'jobId, scheduledStart, and scheduledEnd are required' },
        { status: 400 }
      );
    }

    const newStart = new Date(scheduledStart);
    const newEnd = new Date(scheduledEnd);

    // Validate dates
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (newEnd <= newStart) {
      return NextResponse.json(
        { error: 'scheduledEnd must be after scheduledStart' },
        { status: 400 }
      );
    }

    // Verify job belongs to org
    const job = await prisma.cleaningWorkOrder.findFirst({
      where: {
        id: jobId,
        orgId: auth.orgId,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check for conflicts with same technician (if assigned)
    if (job.assignedTo) {
      const conflicts = await prisma.cleaningWorkOrder.findMany({
        where: {
          orgId: auth.orgId,
          assignedTo: job.assignedTo,
          id: { not: jobId },
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          OR: [
            // New job starts during existing job
            {
              AND: [
                { scheduledStart: { lte: newStart } },
                { scheduledEnd: { gt: newStart } },
              ],
            },
            // New job ends during existing job
            {
              AND: [
                { scheduledStart: { lt: newEnd } },
                { scheduledEnd: { gte: newEnd } },
              ],
            },
            // New job completely overlaps existing job
            {
              AND: [
                { scheduledStart: { gte: newStart } },
                { scheduledEnd: { lte: newEnd } },
              ],
            },
          ],
        },
        select: {
          id: true,
          publicId: true,
          scheduledStart: true,
          scheduledEnd: true,
        },
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Schedule conflict detected',
            conflicts: conflicts.map((c) => ({
              id: c.id,
              publicId: c.publicId,
              scheduledStart: c.scheduledStart.toISOString(),
              scheduledEnd: c.scheduledEnd.toISOString(),
            })),
          },
          { status: 409 }
        );
      }
    }

    const previous = {
      scheduledStart: job.scheduledStart,
      scheduledEnd: job.scheduledEnd,
    };

    // Update schedule
    const updatedJob = await prisma.cleaningWorkOrder.update({
      where: { id: jobId },
      data: {
        scheduledStart: newStart,
        scheduledEnd: newEnd,
        scheduledDate: newStart, // Also update scheduledDate to match
      },
      include: {
        CleaningContract: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    // Log event
    try {
      await prisma.cleaningWorkOrderEvent.create({
        data: {
          workOrderId: updatedJob.id,
          eventType: 'RESCHEDULED',
          userId: auth.userId ?? null,
          metadata: {
            previousStart: previous.scheduledStart,
            previousEnd: previous.scheduledEnd,
            newStart,
            newEnd,
          },
        },
      });
    } catch (e) {
      console.warn('Failed to create RESCHEDULED event for work order', jobId, e);
    }

    // Map to response format
    const customer = updatedJob.CleaningContract?.customerId
      ? await prisma.customer.findUnique({
          where: { id: updatedJob.CleaningContract.customerId },
          select: {
            id: true,
            company: true,
            primaryName: true,
            primaryPhone: true,
          },
        })
      : null;
    const customerName = customer?.primaryName || customer?.company || 'Unknown Customer';

    // Fetch assigned user name if assigned
    let assignedName: string | null = null;
    if (updatedJob.assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: updatedJob.assignedTo },
        select: { name: true },
      });
      if (assignedUser) {
        assignedName = assignedUser.name || null;
      }
    }

    const response = {
      id: updatedJob.id,
      publicId: updatedJob.publicId,
      title: updatedJob.publicId,
      customerName,
      customerPhone: customer?.primaryPhone || '',
      address: updatedJob.siteAddress,
      scheduledStart: updatedJob.scheduledStart.toISOString(),
      scheduledEnd: updatedJob.scheduledEnd.toISOString(),
      duration: Math.round(
        (updatedJob.scheduledEnd.getTime() - updatedJob.scheduledStart.getTime()) / 60000
      ),
      status: updatedJob.status.toLowerCase().replace('_', '-'),
      priority: 'normal',
      assignedToId: updatedJob.assignedTo,
      assignedToName: assignedName,
      jobType: updatedJob.spaceType || 'standard-cleaning',
      estimatedRevenue: 0,
      notes: '',
    };

    return NextResponse.json({ job: response });
  } catch (error) {
    console.error('Failed to reschedule job:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule job' },
      { status: 500 }
    );
  }
}

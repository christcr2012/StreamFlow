// apps/tenant-app/src/app/api/schedule/jobs/assign/route.ts
// POST /api/schedule/jobs/assign - Assign job to technician

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
    const { jobId, technicianId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
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

    // If technicianId provided, verify they belong to org
    if (technicianId) {
      const technician = await prisma.user.findFirst({
        where: {
          id: technicianId,
          orgId: auth.orgId,
          role: { in: ['STAFF', 'PROVIDER'] },
          status: 'active',
        },
      });

      if (!technician) {
        return NextResponse.json({ error: 'Technician not found or not available' }, { status: 404 });
      }
    }

    const wasAssignedTo = job.assignedTo;

    // Update assignment
    const updatedJob = await prisma.cleaningWorkOrder.update({
      where: { id: jobId },
      data: {
        assignedTo: technicianId || null,
        assignedAt: technicianId ? new Date() : null,
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
      const eventType = technicianId
        ? (wasAssignedTo && wasAssignedTo !== technicianId ? 'REASSIGNED' : 'ASSIGNED')
        : 'UNASSIGNED';
      await prisma.cleaningWorkOrderEvent.create({
        data: {
          workOrderId: updatedJob.id,
          eventType,
          userId: auth.userId ?? null,
          metadata: {
            previousAssignee: wasAssignedTo ?? null,
            newAssignee: technicianId ?? null,
          },
        },
      });
    } catch (e) {
      console.warn('Failed to create assignment event for work order', jobId, e);
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
    console.error('Failed to assign job:', error);
    return NextResponse.json(
      { error: 'Failed to assign job' },
      { status: 500 }
    );
  }
}

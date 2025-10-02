import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateJobSchema = z.object({
  org_id: z.string().optional(),
  contact_id: z.string().optional(),
  location: z.string().optional(),
  window_start: z.string().datetime(),
  window_end: z.string().datetime(),
  lob: z.string().optional(),
});

const CreateVisitSchema = z.object({
  job_id: z.string().min(1),
  scheduled_at: z.string().datetime(),
  duration_min: z.number().int().positive(),
  crew_id: z.string().optional(),
});

const AssignCrewSchema = z.object({
  visit_id: z.string().min(1),
  crew_id: z.string().min(1),
});

const RescheduleVisitSchema = z.object({
  visit_id: z.string().min(1),
  new_time: z.string().datetime(),
});

export class SchedulingService {
  async createJob(orgId: string, userId: string, data: z.infer<typeof CreateJobSchema>) {
    const validated = CreateJobSchema.parse(data);

    const job = await prisma.job.create({
      data: {
        orgId,
        customerId: validated.org_id,
        status: 'planned',
        assignedTo: userId,
        schedule: {
          window_start: validated.window_start,
          window_end: validated.window_end,
          location: validated.location,
          lob: validated.lob,
        } as any,
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'create',
        resource: `job:${job.id}`,
        meta: {
          window_start: validated.window_start,
          window_end: validated.window_end,
        },
      },
    });

    return job;
  }

  async createVisit(orgId: string, userId: string, data: z.infer<typeof CreateVisitSchema>) {
    const validated = CreateVisitSchema.parse(data);

    const job = await prisma.job.findFirst({
      where: { id: validated.job_id, orgId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        orgId,
        customerId: job.customerId,
        title: `Visit for Job ${job.id}`,
        description: `Scheduled visit - Duration: ${validated.duration_min} minutes`,
        status: 'SCHEDULED',
        priority: 'MEDIUM',
        scheduledStartAt: new Date(validated.scheduled_at),
      },
    });

    if (validated.crew_id) {
      await prisma.jobAssignment.create({
        data: {
          orgId,
          jobId: workOrder.id,
          employeeId: validated.crew_id,
          role: 'worker',
        },
      });
    }

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'create',
        resource: `visit:${workOrder.id}`,
        meta: {
          job_id: validated.job_id,
          scheduled_at: validated.scheduled_at,
        },
      },
    });

    return workOrder;
  }

  async assignCrew(orgId: string, userId: string, data: z.infer<typeof AssignCrewSchema>) {
    const validated = AssignCrewSchema.parse(data);

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: validated.visit_id, orgId },
    });

    if (!workOrder) {
      throw new Error('Visit not found');
    }

    const assignment = await prisma.jobAssignment.create({
      data: {
        orgId,
        jobId: validated.visit_id,
        employeeId: validated.crew_id,
        role: 'worker',
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'assign',
        resource: `visit:${validated.visit_id}`,
        meta: {
          crew_id: validated.crew_id,
        },
      },
    });

    return assignment;
  }

  async startVisit(orgId: string, userId: string, visitId: string, startedAt?: string) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: visitId, orgId },
    });

    if (!workOrder) {
      throw new Error('Visit not found');
    }

    const updated = await prisma.workOrder.update({
      where: { id: visitId },
      data: {
        actualStartAt: startedAt ? new Date(startedAt) : new Date(),
        status: 'IN_PROGRESS',
      },
    });

    await prisma.workOrderTimeEntry.create({
      data: {
        orgId,
        workOrderId: visitId,
        userId,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'start',
        resource: `visit:${visitId}`,
        meta: {},
      },
    });

    return updated;
  }

  async completeVisit(orgId: string, userId: string, visitId: string, completedAt?: string, notes?: string) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: visitId, orgId },
    });

    if (!workOrder) {
      throw new Error('Visit not found');
    }

    const updated = await prisma.workOrder.update({
      where: { id: visitId },
      data: {
        actualEndAt: completedAt ? new Date(completedAt) : new Date(),
        completedBy: userId,
        status: 'COMPLETED',
      },
    });

    const activeTimeEntry = await prisma.workOrderTimeEntry.findFirst({
      where: {
        workOrderId: visitId,
        userId,
        endedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (activeTimeEntry) {
      const endTime = completedAt ? new Date(completedAt) : new Date();
      const durationMinutes = Math.floor(
        (endTime.getTime() - activeTimeEntry.startedAt.getTime()) / 60000
      );

      await prisma.workOrderTimeEntry.update({
        where: { id: activeTimeEntry.id },
        data: {
          endedAt: endTime,
          durationMinutes,
        },
      });
    }

    if (notes) {
      await prisma.note.create({
        data: {
          orgId,
          userId,
          entityType: 'workorder',
          entityId: visitId,
          body: notes,
        },
      });
    }

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'complete',
        resource: `visit:${visitId}`,
        meta: { hasNotes: !!notes },
      },
    });

    return updated;
  }

  async rescheduleVisit(orgId: string, userId: string, data: z.infer<typeof RescheduleVisitSchema>) {
    const validated = RescheduleVisitSchema.parse(data);

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: validated.visit_id, orgId },
    });

    if (!workOrder) {
      throw new Error('Visit not found');
    }

    const updated = await prisma.workOrder.update({
      where: { id: validated.visit_id },
      data: {
        scheduledStartAt: new Date(validated.new_time),
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'reschedule',
        resource: `visit:${validated.visit_id}`,
        meta: {
          old_time: workOrder.scheduledStartAt?.toISOString(),
          new_time: validated.new_time,
        },
      },
    });

    return updated;
  }

  async cancelVisit(orgId: string, userId: string, visitId: string, reason?: string) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: visitId, orgId },
    });

    if (!workOrder) {
      throw new Error('Visit not found');
    }

    const updated = await prisma.workOrder.update({
      where: { id: visitId },
      data: {
        status: 'CANCELLED',
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'cancel',
        resource: `visit:${visitId}`,
        meta: { reason },
      },
    });

    return updated;
  }
}

export const schedulingService = new SchedulingService();


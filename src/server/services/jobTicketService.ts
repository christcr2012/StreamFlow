// src/server/services/jobTicketService.ts
// Mobile work order management with offline capability
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';

export { ServiceError };

// ===== SCHEMAS =====

export const CreateJobTicketSchema = z.object({
  customerId: z.string(),
  location: z.object({
    address: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    notes: z.string().optional(),
  }),
  serviceType: z.string(),
  scheduledAt: z.string().datetime().optional(),
  estimateId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const AssignJobSchema = z.object({
  crewId: z.string(),
});

export const LogJobActionSchema = z.object({
  action: z.string(), // arrived, started, paused, parts_used, photo_added, notes_added
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  partsUsed: z.array(z.object({
    partId: z.string(),
    quantity: z.number(),
    cost: z.number().optional(),
  })).optional(),
});

export const CompleteJobSchema = z.object({
  signatureUrl: z.string().optional(),
});

// ===== JOB TICKET SERVICE =====

export class JobTicketService {
  /**
   * Create job ticket
   */
  async create(
    orgId: string,
    userId: string,
    input: z.infer<typeof CreateJobTicketSchema>
  ) {
    const validated = CreateJobTicketSchema.parse(input);

    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: validated.customerId, orgId },
    });

    if (!customer) {
      throw new ServiceError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    const ticket = await prisma.jobTicket.create({
      data: {
        orgId,
        customerId: validated.customerId,
        location: validated.location as any,
        serviceType: validated.serviceType,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
        estimateId: validated.estimateId,
        metadata: validated.metadata || {},
        status: 'pending',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'job_ticket.create',
        entityType: 'jobTicket',
        entityId: ticket.id,
        delta: { customerId: validated.customerId, serviceType: validated.serviceType },
      },
    });

    return ticket;
  }

  /**
   * Get job ticket by ID
   */
  async getById(orgId: string, ticketId: string) {
    const ticket = await prisma.jobTicket.findFirst({
      where: { id: ticketId, orgId },
      include: {
        customer: true,
        crew: true,
        logs: {
          orderBy: { createdAt: 'desc' },
        },
        completion: true,
        anomalies: {
          where: { reviewedAt: null },
        },
      },
    });

    if (!ticket) {
      throw new ServiceError('Job ticket not found', 'JOB_TICKET_NOT_FOUND', 404);
    }

    return ticket;
  }

  /**
   * List job tickets
   */
  async list(
    orgId: string,
    options: {
      status?: string;
      crewId?: string;
      customerId?: string;
      limit?: number;
    } = {}
  ) {
    const tickets = await prisma.jobTicket.findMany({
      where: {
        orgId,
        ...(options.status && { status: options.status }),
        ...(options.crewId && { crewId: options.crewId }),
        ...(options.customerId && { customerId: options.customerId }),
      },
      include: {
        customer: {
          select: { id: true, company: true, primaryName: true },
        },
        crew: {
          select: { id: true, name: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: options.limit || 50,
    });

    return tickets;
  }

  /**
   * Assign job to crew
   */
  async assign(
    orgId: string,
    userId: string,
    ticketId: string,
    input: z.infer<typeof AssignJobSchema>
  ) {
    const validated = AssignJobSchema.parse(input);

    // Verify crew exists
    const crew = await prisma.user.findFirst({
      where: { id: validated.crewId, orgId },
    });

    if (!crew) {
      throw new ServiceError('Crew not found', 'CREW_NOT_FOUND', 404);
    }

    const ticket = await prisma.jobTicket.update({
      where: { id: ticketId },
      data: {
        crewId: validated.crewId,
        status: 'assigned',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'job_ticket.assign',
        entityType: 'jobTicket',
        entityId: ticket.id,
        delta: { crewId: validated.crewId },
      },
    });

    return ticket;
  }

  /**
   * Log job action (offline-capable)
   */
  async logAction(
    orgId: string,
    userId: string,
    userRole: string,
    ticketId: string,
    input: z.infer<typeof LogJobActionSchema>
  ) {
    const validated = LogJobActionSchema.parse(input);

    // Verify ticket exists
    const ticket = await prisma.jobTicket.findFirst({
      where: { id: ticketId, orgId },
    });

    if (!ticket) {
      throw new ServiceError('Job ticket not found', 'JOB_TICKET_NOT_FOUND', 404);
    }

    const log = await prisma.jobLog.create({
      data: {
        jobTicketId: ticketId,
        actorId: userId,
        role: userRole,
        action: validated.action,
        notes: validated.notes,
        photoUrl: validated.photoUrl,
        partsUsed: validated.partsUsed || [],
        syncedAt: new Date(), // Synced immediately (offline sync would set this later)
      },
    });

    // Update ticket status based on action
    if (validated.action === 'started') {
      await prisma.jobTicket.update({
        where: { id: ticketId },
        data: { status: 'in_progress' },
      });
    }

    return log;
  }

  /**
   * Complete job ticket
   */
  async complete(
    orgId: string,
    userId: string,
    ticketId: string,
    input: z.infer<typeof CompleteJobSchema>
  ) {
    const validated = CompleteJobSchema.parse(input);

    // Verify ticket exists
    const ticket = await prisma.jobTicket.findFirst({
      where: { id: ticketId, orgId },
    });

    if (!ticket) {
      throw new ServiceError('Job ticket not found', 'JOB_TICKET_NOT_FOUND', 404);
    }

    // Create completion record
    const completion = await prisma.jobCompletion.create({
      data: {
        jobTicketId: ticketId,
        completedAt: new Date(),
        signatureUrl: validated.signatureUrl,
      },
    });

    // Update ticket status
    await prisma.jobTicket.update({
      where: { id: ticketId },
      data: { status: 'completed' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'job_ticket.complete',
        entityType: 'jobTicket',
        entityId: ticket.id,
        delta: { completedAt: new Date() },
      },
    });

    return completion;
  }

  /**
   * Get unsynced logs (for offline sync)
   */
  async getUnsyncedLogs(orgId: string) {
    const logs = await prisma.jobLog.findMany({
      where: {
        syncedAt: null,
        jobTicket: { orgId },
      },
      include: {
        jobTicket: {
          select: { id: true, customerId: true, serviceType: true },
        },
      },
    });

    return logs;
  }
}

export const jobTicketService = new JobTicketService();


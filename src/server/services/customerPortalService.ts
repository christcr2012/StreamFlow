// src/server/services/customerPortalService.ts
// Customer self-service portal functionality
import { prisma } from '@/lib/prisma';
import { ServiceError } from './authService';
import { z } from 'zod';

export { ServiceError };

// ===== SCHEMAS =====

const CreateAppointmentRequestSchema = z.object({
  customerId: z.string(),
  serviceType: z.string(),
  preferredDate: z.string().datetime(),
  notes: z.string().optional(),
});

const CustomerFeedbackSchema = z.object({
  customerId: z.string(),
  jobId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  category: z.enum(['service', 'communication', 'quality', 'timeliness', 'other']),
});

// ===== CUSTOMER PORTAL SERVICE =====

export class CustomerPortalService {
  /**
   * Get customer dashboard data
   */
  async getDashboard(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        org: {
          select: { name: true },
        },
      },
    });

    if (!customer) {
      throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
    }

    // Get recent jobs
    const recentJobs = await prisma.jobTicket.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        serviceType: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
      },
    });

    // Get upcoming appointments
    const upcomingJobs = await prisma.jobTicket.findMany({
      where: {
        customerId,
        scheduledAt: { gte: new Date() },
        status: { in: ['assigned', 'in_progress'] },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 3,
      select: {
        id: true,
        serviceType: true,
        scheduledAt: true,
        status: true,
      },
    });

    // TODO: Get invoices when invoice system is implemented

    return {
      customer: {
        id: customer.id,
        name: customer.primaryName,
        email: customer.primaryEmail,
        phone: customer.primaryPhone,
        company: customer.company,
        orgName: customer.org.name,
      },
      recentJobs,
      upcomingJobs,
      stats: {
        totalJobs: await prisma.jobTicket.count({ where: { customerId } }),
        completedJobs: await prisma.jobTicket.count({
          where: { customerId, status: 'completed' },
        }),
      },
    };
  }

  /**
   * Get customer job history
   */
  async getJobHistory(customerId: string, limit: number = 20) {
    const jobs = await prisma.jobTicket.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        serviceType: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jobs;
  }

  /**
   * Get job details for customer
   */
  async getJobDetails(customerId: string, jobId: string) {
    const job = await prisma.jobTicket.findFirst({
      where: {
        id: jobId,
        customerId,
      },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        completion: true,
      },
    });

    if (!job) {
      throw new ServiceError('Job not found', 'NOT_FOUND', 404);
    }

    return job;
  }

  /**
   * Request appointment
   */
  async requestAppointment(input: z.infer<typeof CreateAppointmentRequestSchema>) {
    const validated = CreateAppointmentRequestSchema.parse(input);

    // Create job ticket as appointment request
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
      select: { orgId: true },
    });

    if (!customer) {
      throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
    }

    const job = await prisma.jobTicket.create({
      data: {
        orgId: customer.orgId,
        customerId: validated.customerId,
        serviceType: validated.serviceType,
        status: 'pending',
        scheduledAt: new Date(validated.preferredDate),
        location: {},
        metadata: {
          type: 'appointment_request',
          notes: validated.notes,
        },
      },
    });

    // TODO: Send notification to org

    return job;
  }

  /**
   * Submit customer feedback
   */
  async submitFeedback(input: z.infer<typeof CustomerFeedbackSchema>) {
    const validated = CustomerFeedbackSchema.parse(input);

    // Store feedback in customer notes for now
    // TODO: Create dedicated Feedback table
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
      select: { notes: true, orgId: true },
    });

    if (!customer) {
      throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
    }

    const feedbackEntry = `[${new Date().toISOString()}] Rating: ${validated.rating}/5, Category: ${validated.category}${validated.comment ? `, Comment: ${validated.comment}` : ''}`;
    const updatedNotes = customer.notes ? `${customer.notes}\n${feedbackEntry}` : feedbackEntry;

    await prisma.customer.update({
      where: { id: validated.customerId },
      data: {
        notes: updatedNotes,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: customer.orgId,
        actorId: validated.customerId,
        action: 'customer.feedback',
        entityType: 'customer',
        entityId: validated.customerId,
        delta: { rating: validated.rating, category: validated.category },
      },
    });

    return { success: true };
  }

  /**
   * Get customer notifications
   */
  async getNotifications(customerId: string) {
    // TODO: Implement notification system
    // For now, return empty array
    return [];
  }

  /**
   * Get customer invoices
   */
  async getInvoices(customerId: string) {
    // TODO: Implement invoice system
    // For now, return empty array
    return [];
  }

  /**
   * Verify customer access token
   */
  async verifyCustomerToken(token: string): Promise<{ customerId: string; orgId: string } | null> {
    // TODO: Implement proper JWT token verification
    // For now, simple base64 decode
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const data = JSON.parse(decoded);
      return { customerId: data.customerId, orgId: data.orgId };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate customer access token
   */
  generateCustomerToken(customerId: string, orgId: string): string {
    // TODO: Implement proper JWT token generation
    // For now, simple base64 encode
    const data = { customerId, orgId, createdAt: Date.now() };
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }
}

export const customerPortalService = new CustomerPortalService();


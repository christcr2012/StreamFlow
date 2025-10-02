/**
 * Fleet Maintenance Ticket Service
 * Binder3: Fleet & Assets Management
 * 
 * Handles CRUD operations for fleet maintenance tickets
 */

import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit/auditLog';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const CreateTicketSchema = z.object({
  vehicleId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.string().optional(),
  dvirRef: z.string().optional(),
});

export const UpdateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'in_progress', 'waiting_parts', 'done', 'canceled']).optional(),
  assignedTo: z.string().optional(),
  dvirRef: z.string().optional(),
});

export const CloseTicketSchema = z.object({
  resolutionNotes: z.string().optional(),
  closedAt: z.string().datetime().optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type CloseTicketInput = z.infer<typeof CloseTicketSchema>;

export interface TicketResult {
  id: string;
  orgId: string;
  vehicleId: string;
  openedBy: string | null;
  assignedTo: string | null;
  title: string;
  description: string | null;
  severity: string | null;
  status: string;
  dvirRef: string | null;
  openedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class MaintenanceTicketService {
  /**
   * Create a new maintenance ticket
   */
  async create(
    orgId: string,
    userId: string,
    input: CreateTicketInput
  ): Promise<TicketResult> {
    const validated = CreateTicketSchema.parse(input);

    // Verify vehicle exists
    const vehicle = await prisma.fleetVehicle.findUnique({
      where: { id: validated.vehicleId },
    });

    if (!vehicle || vehicle.orgId !== orgId) {
      throw new Error('Vehicle not found');
    }

    // Create ticket
    const ticket = await prisma.fleetMaintenanceTicket.create({
      data: {
        orgId,
        vehicleId: validated.vehicleId,
        openedBy: userId,
        assignedTo: validated.assignedTo,
        title: validated.title,
        description: validated.description,
        severity: validated.severity,
        dvirRef: validated.dvirRef,
        status: 'open',
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'create',
      resource: `maintenance_ticket:${ticket.id}`,
      meta: {
        vehicleId: validated.vehicleId,
        title: validated.title,
        severity: validated.severity,
      },
    });

    return ticket as TicketResult;
  }

  /**
   * Get ticket by ID
   */
  async getById(orgId: string, ticketId: string): Promise<TicketResult | null> {
    const ticket = await prisma.fleetMaintenanceTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || ticket.orgId !== orgId) {
      return null;
    }

    return ticket as TicketResult;
  }

  /**
   * List tickets for a tenant
   */
  async list(
    orgId: string,
    options: {
      vehicleId?: string;
      status?: string;
      assignedTo?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TicketResult[]> {
    const { vehicleId, status, assignedTo, limit = 50, offset = 0 } = options;

    const tickets = await prisma.fleetMaintenanceTicket.findMany({
      where: {
        orgId,
        ...(vehicleId && { vehicleId }),
        ...(status && { status }),
        ...(assignedTo && { assignedTo }),
      },
      orderBy: { openedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return tickets as TicketResult[];
  }

  /**
   * Update ticket
   */
  async update(
    orgId: string,
    userId: string,
    ticketId: string,
    input: UpdateTicketInput
  ): Promise<TicketResult> {
    const validated = UpdateTicketSchema.parse(input);

    // Verify ticket exists
    const existing = await this.getById(orgId, ticketId);
    if (!existing) {
      throw new Error('Ticket not found');
    }

    // Update ticket
    const ticket = await prisma.fleetMaintenanceTicket.update({
      where: { id: ticketId },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.severity !== undefined && { severity: validated.severity }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.assignedTo !== undefined && { assignedTo: validated.assignedTo }),
        ...(validated.dvirRef !== undefined && { dvirRef: validated.dvirRef }),
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: `maintenance_ticket:${ticket.id}`,
      meta: { changes: validated },
    });

    return ticket as TicketResult;
  }

  /**
   * Close ticket
   */
  async close(
    orgId: string,
    userId: string,
    ticketId: string,
    input: CloseTicketInput
  ): Promise<TicketResult> {
    const validated = CloseTicketSchema.parse(input);

    // Verify ticket exists
    const existing = await this.getById(orgId, ticketId);
    if (!existing) {
      throw new Error('Ticket not found');
    }

    // Close ticket
    const ticket = await prisma.fleetMaintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status: 'done',
        closedAt: validated.closedAt ? new Date(validated.closedAt) : new Date(),
      },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: `maintenance_ticket:${ticket.id}`,
      meta: {
        action: 'close',
        resolutionNotes: validated.resolutionNotes,
        closedAt: ticket.closedAt?.toISOString(),
      },
    });

    return ticket as TicketResult;
  }

  /**
   * Assign ticket to user
   */
  async assign(
    orgId: string,
    userId: string,
    ticketId: string,
    assignedTo: string
  ): Promise<TicketResult> {
    // Verify ticket exists
    const existing = await this.getById(orgId, ticketId);
    if (!existing) {
      throw new Error('Ticket not found');
    }

    // Assign ticket
    const ticket = await prisma.fleetMaintenanceTicket.update({
      where: { id: ticketId },
      data: { assignedTo },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: `maintenance_ticket:${ticket.id}`,
      meta: {
        action: 'assign',
        assignedTo,
      },
    });

    return ticket as TicketResult;
  }

  /**
   * Delete ticket
   */
  async delete(
    orgId: string,
    userId: string,
    ticketId: string
  ): Promise<void> {
    // Verify ticket exists
    const existing = await this.getById(orgId, ticketId);
    if (!existing) {
      throw new Error('Ticket not found');
    }

    // Delete ticket
    await prisma.fleetMaintenanceTicket.delete({
      where: { id: ticketId },
    });

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'delete',
      resource: `maintenance_ticket:${ticketId}`,
    });
  }
}

export const maintenanceTicketService = new MaintenanceTicketService();


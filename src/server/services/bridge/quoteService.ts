// src/server/services/bridge/quoteService.ts
// Bridge System: Quote → Opportunity Integration
// Manages quotes/estimates and their link to CRM opportunities

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '../auditService';

// ===== TYPES & SCHEMAS =====

export const CreateQuoteSchema = z.object({
  opportunityId: z.string().optional(),
  customerId: z.string().min(1, 'Customer ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    total: z.number().min(0),
  })),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  validUntil: z.string().datetime().optional(),
});

export const UpdateQuoteSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    total: z.number().min(0),
  })).optional(),
  subtotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  validUntil: z.string().datetime().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
});

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof UpdateQuoteSchema>;

// ===== QUOTE SERVICE =====

export class QuoteService {
  /**
   * Create quote
   * If linked to opportunity, this enables Quote→Opportunity bridge
   */
  async create(
    orgId: string,
    userId: string,
    input: CreateQuoteInput
  ) {
    const validated = CreateQuoteSchema.parse(input);

    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: validated.customerId, orgId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // If opportunityId provided, verify it exists
    if (validated.opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: validated.opportunityId, orgId },
      });

      if (!opportunity) {
        throw new Error('Opportunity not found');
      }
    }

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        orgId,
        opportunityId: validated.opportunityId,
        customerId: validated.customerId,
        title: validated.title,
        description: validated.description,
        items: validated.items as any,
        subtotal: validated.subtotal,
        tax: validated.tax,
        total: validated.total,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : undefined,
        status: 'draft',
        createdBy: userId,
      },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'create',
      entityType: 'quote',
      entityId: quote.id,
      delta: {
        customerId: validated.customerId,
        opportunityId: validated.opportunityId,
        total: validated.total,
      },
    });

    return quote;
  }

  /**
   * Update quote
   * When status changes to accepted/rejected, update linked opportunity
   */
  async update(
    orgId: string,
    userId: string,
    quoteId: string,
    input: UpdateQuoteInput
  ) {
    const validated = UpdateQuoteSchema.parse(input);

    // Get existing quote
    const existing = await prisma.quote.findFirst({
      where: { id: quoteId, orgId },
    });

    if (!existing) {
      throw new Error('Quote not found');
    }

    // Update quote
    const quote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.items && { items: validated.items as any }),
        ...(validated.subtotal !== undefined && { subtotal: validated.subtotal }),
        ...(validated.tax !== undefined && { tax: validated.tax }),
        ...(validated.total !== undefined && { total: validated.total }),
        ...(validated.validUntil && { validUntil: new Date(validated.validUntil) }),
        ...(validated.status && { status: validated.status }),
        ...(validated.status === 'accepted' && { acceptedAt: new Date() }),
        ...(validated.status === 'rejected' && { rejectedAt: new Date() }),
      },
    });

    // Bridge System: Update linked opportunity stage based on quote status
    if (validated.status && existing.opportunityId) {
      let newStage: string | undefined;
      
      if (validated.status === 'sent') {
        newStage = 'proposal';
      } else if (validated.status === 'accepted') {
        newStage = 'closed_won';
      } else if (validated.status === 'rejected') {
        newStage = 'closed_lost';
      }

      if (newStage) {
        await prisma.opportunity.update({
          where: { id: existing.opportunityId },
          data: { stage: newStage },
        });

        // Audit the opportunity stage change
        await auditLog({
          orgId,
          actorId: userId,
          action: 'update',
          entityType: 'opportunity',
          entityId: existing.opportunityId,
          delta: {
            stage: newStage,
            reason: `Quote ${validated.status}`,
          },
        });
      }
    }

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'update',
      entityType: 'quote',
      entityId: quoteId,
      delta: validated,
    });

    return quote;
  }

  /**
   * Get quote by ID
   */
  async getById(orgId: string, quoteId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, orgId },
      include: {
        customer: {
          select: { id: true, company: true, primaryName: true },
        },
        opportunity: {
          select: { id: true, title: true, stage: true },
        },
      },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    return quote;
  }

  /**
   * List quotes
   */
  async list(
    orgId: string,
    options: {
      opportunityId?: string;
      customerId?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;

    const where: any = { orgId };

    if (options.opportunityId) {
      where.opportunityId = options.opportunityId;
    }

    if (options.customerId) {
      where.customerId = options.customerId;
    }

    if (options.status) {
      where.status = options.status;
    }

    const total = await prisma.quote.count({ where });

    const quotes = await prisma.quote.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, company: true, primaryName: true },
        },
        opportunity: {
          select: { id: true, title: true },
        },
      },
    });

    return {
      quotes,
      total,
      page,
      limit,
    };
  }

  /**
   * Delete quote
   */
  async delete(orgId: string, userId: string, quoteId: string) {
    const existing = await prisma.quote.findFirst({
      where: { id: quoteId, orgId },
    });

    if (!existing) {
      throw new Error('Quote not found');
    }

    await prisma.quote.delete({
      where: { id: quoteId },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'delete',
      entityType: 'quote',
      entityId: quoteId,
      delta: {},
    });
  }
}

// Export singleton instance
export const quoteService = new QuoteService();


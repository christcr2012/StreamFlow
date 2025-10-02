import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod schemas for validation
export const CreateQuoteSchema = z.object({
  opportunityId: z.string().optional(),
  customerId: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    total: z.number().nonnegative(),
  })),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  validUntil: z.string().datetime().optional(),
});

export const UpdateQuoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    total: z.number().nonnegative(),
  })).optional(),
  subtotal: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  validUntil: z.string().datetime().nullable().optional(),
});

/**
 * Create a new quote
 * Optionally links to an opportunity
 */
export async function createQuote(params: {
  orgId: string;
  userId: string;
  data: z.infer<typeof CreateQuoteSchema>;
}) {
  const { orgId, userId, data } = params;

  // Verify customer exists
  const customer = await prisma.customer.findFirst({
    where: { orgId, id: data.customerId },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Verify opportunity exists if provided
  if (data.opportunityId) {
    const opportunity = await prisma.opportunity.findFirst({
      where: { orgId, id: data.opportunityId },
    });

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }
  }

  // Create quote
  const quote = await prisma.quote.create({
    data: {
      orgId,
      opportunityId: data.opportunityId || null,
      customerId: data.customerId,
      title: data.title,
      description: data.description || null,
      items: data.items,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      status: 'draft',
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      createdBy: userId,
    },
  });

  return quote;
}

/**
 * Update a quote
 * Auto-updates linked opportunity stage based on quote status
 */
export async function updateQuote(params: {
  orgId: string;
  userId: string;
  quoteId: string;
  data: z.infer<typeof UpdateQuoteSchema>;
}) {
  const { orgId, userId, quoteId, data } = params;

  // Check if quote exists
  const existing = await prisma.quote.findFirst({
    where: { orgId, id: quoteId },
  });

  if (!existing) {
    throw new Error('Quote not found');
  }

  // Build update data
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.items !== undefined) updateData.items = data.items;
  if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
  if (data.tax !== undefined) updateData.tax = data.tax;
  if (data.total !== undefined) updateData.total = data.total;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.validUntil !== undefined) {
    updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
  }

  // Set status timestamps
  if (data.status === 'accepted' && !existing.acceptedAt) {
    updateData.acceptedAt = new Date();
  }
  if (data.status === 'rejected' && !existing.rejectedAt) {
    updateData.rejectedAt = new Date();
  }

  // Update quote
  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: updateData,
  });

  // Auto-update linked opportunity stage (BRIDGE-02 logic)
  if (quote.opportunityId && data.status) {
    let newStage: string | null = null;

    if (data.status === 'sent') {
      newStage = 'proposal';
    } else if (data.status === 'accepted') {
      newStage = 'closed_won';
    } else if (data.status === 'rejected') {
      newStage = 'closed_lost';
    }

    if (newStage) {
      await prisma.opportunity.update({
        where: { id: quote.opportunityId },
        data: { stage: newStage },
      });
    }
  }

  return quote;
}

/**
 * Get a quote by ID
 */
export async function getQuoteById(params: {
  orgId: string;
  quoteId: string;
}) {
  const { orgId, quoteId } = params;

  const quote = await prisma.quote.findFirst({
    where: { orgId, id: quoteId },
    include: {
      customer: true,
      opportunity: true,
    },
  });

  return quote;
}

/**
 * List quotes with filters
 */
export async function listQuotes(params: {
  orgId: string;
  opportunityId?: string;
  customerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const { orgId, opportunityId, customerId, status, limit = 20, offset = 0 } = params;

  const where: any = { orgId };
  if (opportunityId) where.opportunityId = opportunityId;
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        customer: true,
        opportunity: true,
      },
    }),
    prisma.quote.count({ where }),
  ]);

  return { quotes, total };
}

/**
 * Delete a quote
 */
export async function deleteQuote(params: {
  orgId: string;
  quoteId: string;
}) {
  const { orgId, quoteId } = params;

  // Check if quote exists
  const existing = await prisma.quote.findFirst({
    where: { orgId, id: quoteId },
  });

  if (!existing) {
    throw new Error('Quote not found');
  }

  // Delete quote
  await prisma.quote.delete({
    where: { id: quoteId },
  });

  return { id: quoteId };
}


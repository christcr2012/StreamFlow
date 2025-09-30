// src/server/services/opportunityService.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';
import { Decimal } from '@prisma/client/runtime/library';

// Re-export ServiceError for convenience
export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const CreateOpportunitySchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  valueType: z.enum(['RELATIONSHIP', 'JOB']).default('RELATIONSHIP'),
  estValue: z.number().optional(),
  stage: z.string().default('new'),
  ownerId: z.string().optional(),
  sourceLeadId: z.string().optional(),
  classification: z.record(z.any()).default({}),
});

export const UpdateOpportunitySchema = z.object({
  customerId: z.string().optional(),
  valueType: z.enum(['RELATIONSHIP', 'JOB']).optional(),
  estValue: z.number().optional().nullable(),
  stage: z.string().optional(),
  ownerId: z.string().optional().nullable(),
  sourceLeadId: z.string().optional().nullable(),
  classification: z.record(z.any()).optional(),
});

export const ListOpportunitiesSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  customerId: z.string().optional(),
  stage: z.string().optional(),
  ownerId: z.string().optional(),
  sortBy: z.enum(['estValue', 'stage', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;
export type ListOpportunitiesInput = z.infer<typeof ListOpportunitiesSchema>;

export interface OpportunityResult {
  id: string;
  orgId: string;
  customerId: string;
  valueType: string;
  estValue: Decimal | null;
  stage: string;
  ownerId: string | null;
  sourceLeadId: string | null;
  classification: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListOpportunitiesResult {
  opportunities: OpportunityResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== OPPORTUNITY SERVICE =====

export class OpportunityService {
  /**
   * Create a new opportunity
   */
  async create(orgId: string, userId: string, input: CreateOpportunityInput): Promise<OpportunityResult> {
    // Validate input
    const validated = CreateOpportunitySchema.parse(input);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: {
        orgId_id: {
          orgId,
          id: validated.customerId,
        },
      },
    });

    if (!customer) {
      throw new ServiceError(
        'Customer not found',
        'NOT_FOUND',
        404
      );
    }

    // Create opportunity
    const opportunity = await prisma.opportunity.create({
      data: {
        orgId,
        customerId: validated.customerId,
        valueType: validated.valueType,
        estValue: validated.estValue ? new Decimal(validated.estValue) : null,
        stage: validated.stage,
        ownerId: validated.ownerId,
        sourceLeadId: validated.sourceLeadId,
        classification: validated.classification,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'opportunity.create',
        entityType: 'opportunity',
        entityId: opportunity.id,
        delta: {
          customerId: opportunity.customerId,
          stage: opportunity.stage,
          estValue: opportunity.estValue?.toString(),
        },
      },
    });

    return opportunity;
  }

  /**
   * Get opportunity by ID
   */
  async getById(orgId: string, opportunityId: string): Promise<OpportunityResult> {
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        orgId,
      },
    });

    if (!opportunity) {
      throw new ServiceError(
        'Opportunity not found',
        'NOT_FOUND',
        404
      );
    }

    return opportunity;
  }

  /**
   * List opportunities with pagination and filters
   */
  async list(orgId: string, input: ListOpportunitiesInput): Promise<ListOpportunitiesResult> {
    // Validate input
    const validated = ListOpportunitiesSchema.parse(input);

    // Build where clause
    const where: any = { orgId };

    if (validated.customerId) {
      where.customerId = validated.customerId;
    }

    if (validated.stage) {
      where.stage = validated.stage;
    }

    if (validated.ownerId) {
      where.ownerId = validated.ownerId;
    }

    // Get total count
    const total = await prisma.opportunity.count({ where });

    // Get opportunities
    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: {
        [validated.sortBy]: validated.sortOrder,
      },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    });

    return {
      opportunities,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    };
  }

  /**
   * Update opportunity
   */
  async update(
    orgId: string,
    userId: string,
    opportunityId: string,
    input: UpdateOpportunityInput
  ): Promise<OpportunityResult> {
    // Validate input
    const validated = UpdateOpportunitySchema.parse(input);

    // Check if opportunity exists
    const existing = await this.getById(orgId, opportunityId);

    // If customerId being updated, verify it exists
    if (validated.customerId && validated.customerId !== existing.customerId) {
      const customer = await prisma.customer.findUnique({
        where: {
          orgId_id: {
            orgId,
            id: validated.customerId,
          },
        },
      });

      if (!customer) {
        throw new ServiceError(
          'Customer not found',
          'NOT_FOUND',
          404
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...validated };
    if (validated.estValue !== undefined) {
      updateData.estValue = validated.estValue !== null ? new Decimal(validated.estValue) : null;
    }

    // Update opportunity
    const opportunity = await prisma.opportunity.update({
      where: {
        id: opportunityId,
      },
      data: updateData,
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'opportunity.update',
        entityType: 'opportunity',
        entityId: opportunity.id,
        delta: {
          before: {
            stage: existing.stage,
            estValue: existing.estValue?.toString(),
          },
          after: {
            stage: validated.stage,
            estValue: validated.estValue?.toString(),
          },
        },
      },
    });

    return opportunity;
  }

  /**
   * Delete opportunity
   */
  async delete(orgId: string, userId: string, opportunityId: string): Promise<void> {
    // Check if opportunity exists
    const existing = await this.getById(orgId, opportunityId);

    // Delete opportunity
    await prisma.opportunity.delete({
      where: {
        id: opportunityId,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'opportunity.delete',
        entityType: 'opportunity',
        entityId: opportunityId,
        delta: {
          customerId: existing.customerId,
          stage: existing.stage,
        },
      },
    });
  }
}

// Export singleton instance
export const opportunityService = new OpportunityService();


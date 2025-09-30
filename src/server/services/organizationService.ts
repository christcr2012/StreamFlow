// src/server/services/organizationService.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';

// Re-export ServiceError for convenience
export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const CreateOrganizationSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(200, 'Company name too long'),
  primaryName: z.string().optional(),
  primaryEmail: z.string().email('Invalid email').optional(),
  primaryPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateOrganizationSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(200, 'Company name too long').optional(),
  primaryName: z.string().optional(),
  primaryEmail: z.string().email('Invalid email').optional().nullable(),
  primaryPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ListOrganizationsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['company', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type ListOrganizationsInput = z.infer<typeof ListOrganizationsSchema>;

export interface OrganizationResult {
  id: string;
  orgId: string;
  publicId: string;
  company: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListOrganizationsResult {
  organizations: OrganizationResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== ORGANIZATION SERVICE =====

export class OrganizationService {
  /**
   * Create a new organization
   */
  async create(orgId: string, userId: string, input: CreateOrganizationInput): Promise<OrganizationResult> {
    // Validate input
    const validated = CreateOrganizationSchema.parse(input);

    // Generate public ID
    const publicId = `ORG-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create organization
    const organization = await prisma.customer.create({
      data: {
        orgId,
        publicId,
        company: validated.company,
        primaryName: validated.primaryName,
        primaryEmail: validated.primaryEmail,
        primaryPhone: validated.primaryPhone,
        notes: validated.notes,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'organization.create',
        entityType: 'customer',
        entityId: organization.id,
        delta: {
          company: organization.company,
          publicId: organization.publicId,
        },
      },
    });

    return organization;
  }

  /**
   * Get organization by ID
   */
  async getById(orgId: string, organizationId: string): Promise<OrganizationResult> {
    const organization = await prisma.customer.findUnique({
      where: {
        orgId_id: {
          orgId,
          id: organizationId,
        },
      },
    });

    if (!organization) {
      throw new ServiceError(
        'Organization not found',
        'NOT_FOUND',
        404
      );
    }

    return organization;
  }

  /**
   * List organizations with pagination and search
   */
  async list(orgId: string, input: ListOrganizationsInput): Promise<ListOrganizationsResult> {
    // Validate input
    const validated = ListOrganizationsSchema.parse(input);

    // Build where clause
    const where: any = { orgId };

    if (validated.search) {
      where.OR = [
        { company: { contains: validated.search, mode: 'insensitive' } },
        { primaryName: { contains: validated.search, mode: 'insensitive' } },
        { primaryEmail: { contains: validated.search, mode: 'insensitive' } },
        { publicId: { contains: validated.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.customer.count({ where });

    // Get organizations
    const organizations = await prisma.customer.findMany({
      where,
      orderBy: {
        [validated.sortBy]: validated.sortOrder,
      },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    });

    return {
      organizations,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    };
  }

  /**
   * Update organization
   */
  async update(
    orgId: string,
    userId: string,
    organizationId: string,
    input: UpdateOrganizationInput
  ): Promise<OrganizationResult> {
    // Validate input
    const validated = UpdateOrganizationSchema.parse(input);

    // Check if organization exists
    const existing = await this.getById(orgId, organizationId);

    // Update organization
    const organization = await prisma.customer.update({
      where: {
        orgId_id: {
          orgId,
          id: organizationId,
        },
      },
      data: validated,
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'organization.update',
        entityType: 'customer',
        entityId: organization.id,
        delta: {
          before: {
            company: existing.company,
            primaryName: existing.primaryName,
            primaryEmail: existing.primaryEmail,
            primaryPhone: existing.primaryPhone,
            notes: existing.notes,
          },
          after: validated,
        },
      },
    });

    return organization;
  }

  /**
   * Delete organization
   */
  async delete(orgId: string, userId: string, organizationId: string): Promise<void> {
    // Check if organization exists
    const existing = await this.getById(orgId, organizationId);

    // Check if organization has related records
    const [opportunityCount, contactCount, jobCount] = await Promise.all([
      prisma.opportunity.count({ where: { orgId, customerId: organizationId } }),
      prisma.contact.count({ where: { orgId, organizationId } }),
      prisma.job.count({ where: { orgId, customerId: organizationId } }),
    ]);

    if (opportunityCount > 0 || contactCount > 0 || jobCount > 0) {
      throw new ServiceError(
        'Cannot delete organization with related records. Please delete or reassign related opportunities, contacts, and jobs first.',
        'CONFLICT',
        409,
        {
          opportunities: opportunityCount,
          contacts: contactCount,
          jobs: jobCount,
        }
      );
    }

    // Delete organization
    await prisma.customer.delete({
      where: {
        orgId_id: {
          orgId,
          id: organizationId,
        },
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'organization.delete',
        entityType: 'customer',
        entityId: organizationId,
        delta: {
          company: existing.company,
          publicId: existing.publicId,
        },
      },
    });
  }
}

// Export singleton instance
export const organizationService = new OrganizationService();


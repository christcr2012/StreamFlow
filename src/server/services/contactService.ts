// src/server/services/contactService.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';

// Re-export ServiceError for convenience
export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const CreateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  organizationId: z.string().optional(),
  isPrimary: z.boolean().default(false),
  mobilePhone: z.string().optional(),
  workPhone: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().optional(),
  address: z.any().optional(),
  linkedIn: z.string().optional(),
  twitter: z.string().optional(),
  ownerId: z.string().optional(),
  source: z.string().optional(),
  status: z.string().default('active'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
});

export const UpdateContactSchema = CreateContactSchema.partial();

export const ListContactsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  organizationId: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt', 'lastContactedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
export type ListContactsInput = z.infer<typeof ListContactsSchema>;

export interface ContactResult {
  id: string;
  orgId: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  organizationId: string | null;
  isPrimary: boolean;
  mobilePhone: string | null;
  workPhone: string | null;
  fax: string | null;
  website: string | null;
  address: any;
  linkedIn: string | null;
  twitter: string | null;
  ownerId: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  tags: any;
  customFields: any;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt: Date | null;
}

export interface ListContactsResult {
  contacts: ContactResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== CONTACT SERVICE =====

export class ContactService {
  /**
   * Create a new contact
   */
  async create(orgId: string, userId: string, input: CreateContactInput): Promise<ContactResult> {
    // Validate input
    const validated = CreateContactSchema.parse(input);

    // Get or create organization
    let organizationId = validated.organizationId;
    if (!organizationId) {
      // Auto-create "Unassigned" organization
      const unassignedOrg = await prisma.organization.upsert({
        where: {
          orgId_name: {
            orgId,
            name: 'Unassigned',
          },
        },
        update: {},
        create: {
          orgId,
          name: 'Unassigned',
          archived: false,
        },
      });
      organizationId = unassignedOrg.id;
    } else {
      // Verify organization exists
      const org = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

      if (!org || org.orgId !== orgId) {
        throw new ServiceError(
          'Organization not found',
          'NOT_FOUND',
          404
        );
      }
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        orgId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        title: validated.title,
        department: validated.department,
        organizationId,
        isPrimary: validated.isPrimary,
        mobilePhone: validated.mobilePhone,
        workPhone: validated.workPhone,
        fax: validated.fax,
        website: validated.website,
        address: validated.address,
        linkedIn: validated.linkedIn,
        twitter: validated.twitter,
        ownerId: validated.ownerId,
        source: validated.source,
        status: validated.status,
        notes: validated.notes,
        tags: validated.tags,
        customFields: validated.customFields,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'contact.create',
        entityType: 'contact',
        entityId: contact.id,
        delta: {
          name: contact.name,
          email: contact.email,
          organizationId: contact.organizationId,
        },
      },
    });

    return contact;
  }

  /**
   * Get contact by ID
   */
  async getById(orgId: string, contactId: string): Promise<ContactResult> {
    const contact = await prisma.contact.findUnique({
      where: {
        orgId_id: {
          orgId,
          id: contactId,
        },
      },
    });

    if (!contact) {
      throw new ServiceError(
        'Contact not found',
        'NOT_FOUND',
        404
      );
    }

    return contact;
  }

  /**
   * List contacts with pagination and search
   */
  async list(orgId: string, input: ListContactsInput): Promise<ListContactsResult> {
    // Validate input
    const validated = ListContactsSchema.parse(input);

    // Build where clause
    const where: any = { orgId };

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: 'insensitive' } },
        { email: { contains: validated.search, mode: 'insensitive' } },
        { phone: { contains: validated.search, mode: 'insensitive' } },
        { title: { contains: validated.search, mode: 'insensitive' } },
        { department: { contains: validated.search, mode: 'insensitive' } },
      ];
    }

    if (validated.organizationId) {
      where.organizationId = validated.organizationId;
    }

    if (validated.status) {
      where.status = validated.status;
    }

    // Get total count
    const total = await prisma.contact.count({ where });

    // Get contacts
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: {
        [validated.sortBy]: validated.sortOrder,
      },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    });

    return {
      contacts,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    };
  }

  /**
   * Update contact
   */
  async update(
    orgId: string,
    userId: string,
    contactId: string,
    input: UpdateContactInput
  ): Promise<ContactResult> {
    // Validate input
    const validated = UpdateContactSchema.parse(input);

    // Check if contact exists
    const existing = await this.getById(orgId, contactId);

    // If organizationId being updated, verify it exists
    if (validated.organizationId && validated.organizationId !== existing.organizationId) {
      const org = await prisma.customer.findUnique({
        where: {
          orgId_id: {
            orgId,
            id: validated.organizationId,
          },
        },
      });

      if (!org) {
        throw new ServiceError(
          'Organization not found',
          'NOT_FOUND',
          404
        );
      }
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: {
        orgId_id: {
          orgId,
          id: contactId,
        },
      },
      data: validated,
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'contact.update',
        entityType: 'contact',
        entityId: contact.id,
        delta: {
          before: {
            name: existing.name,
            email: existing.email,
            organizationId: existing.organizationId,
          },
          after: validated,
        },
      },
    });

    return contact;
  }

  /**
   * Delete contact
   */
  async delete(orgId: string, userId: string, contactId: string): Promise<void> {
    // Check if contact exists
    const existing = await this.getById(orgId, contactId);

    // Delete contact
    await prisma.contact.delete({
      where: {
        orgId_id: {
          orgId,
          id: contactId,
        },
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'contact.delete',
        entityType: 'contact',
        entityId: contactId,
        delta: {
          name: existing.name,
          email: existing.email,
        },
      },
    });
  }
}

// Export singleton instance
export const contactService = new ContactService();


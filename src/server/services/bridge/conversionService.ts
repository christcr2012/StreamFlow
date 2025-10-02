// src/server/services/bridge/conversionService.ts
// Bridge System: Lead → Customer Conversion
// Converts a Lead into FSM Customer + CRM Organization + CRM Contact

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '../auditService';

// ===== TYPES & SCHEMAS =====

export const ConvertLeadSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  createOrganization: z.boolean().default(true),
  createContact: z.boolean().default(true),
  organizationName: z.string().optional(),
  contactName: z.string().optional(),
});

export type ConvertLeadInput = z.infer<typeof ConvertLeadSchema>;

export interface ConvertLeadResult {
  customerId: string;
  organizationId?: string;
  contactId?: string;
  auditId: string;
  alreadyConverted: boolean;
}

// ===== CONVERSION SERVICE =====

export class ConversionService {
  /**
   * Convert a Lead to Customer + Organization + Contact
   * This is the primary bridge between CRM and FSM
   */
  async convertLead(
    orgId: string,
    userId: string,
    input: ConvertLeadInput
  ): Promise<ConvertLeadResult> {
    // Validate input
    const validated = ConvertLeadSchema.parse(input);

    // Get lead
    const lead = await prisma.lead.findFirst({
      where: {
        id: validated.leadId,
        orgId,
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Check if already converted (idempotent)
    if (lead.convertedToCustomerId) {
      return {
        customerId: lead.convertedToCustomerId,
        organizationId: lead.convertedToOrganizationId || undefined,
        contactId: lead.convertedToContactId || undefined,
        auditId: lead.conversionAuditId || '',
        alreadyConverted: true,
      };
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization (if requested)
      let organizationId: string | undefined;
      if (validated.createOrganization && lead.company) {
        const organization = await tx.organization.create({
          data: {
            orgId,
            name: validated.organizationName || lead.company,
            domain: lead.website ? new URL(lead.website).hostname : undefined,
            industry: lead.industryType || undefined,
            website: lead.website || undefined,
            phone: lead.phoneE164 || undefined,
            archived: false,
          },
        });
        organizationId = organization.id;
      }

      // 2. Create Contact (if requested)
      let contactId: string | undefined;
      if (validated.createContact && lead.contactName && organizationId) {
        const contact = await tx.contact.create({
          data: {
            orgId,
            name: validated.contactName || lead.contactName,
            email: lead.email || undefined,
            phone: lead.phoneE164 || undefined,
            organizationId, // Guaranteed to be defined by if condition
            isPrimary: true,
            source: lead.sourceType,
          },
        });
        contactId = contact.id;
      }

      // 3. Create FSM Customer
      const customer = await tx.customer.create({
        data: {
          orgId,
          publicId: `cust_${Date.now()}`,
          company: lead.company || undefined,
          primaryName: lead.contactName || undefined,
          primaryEmail: lead.email || undefined,
          primaryPhone: lead.phoneE164 || undefined,
          notes: lead.notes || undefined,
        },
      });

      // 4. Create Conversion Audit
      const conversionAudit = await tx.conversionAudit.create({
        data: {
          tenantId: orgId,
          organizationId: organizationId || undefined,
          userId,
          action: 'convert',
          resource: `lead:${lead.id}`,
          meta: {
            leadSource: lead.sourceType,
            leadStage: lead.stage,
            leadScore: lead.aiScore,
            company: lead.company,
            contactName: lead.contactName,
            email: lead.email,
            phone: lead.phoneE164,
            customerId: customer.id,
            contactId,
          } as any,
        },
      });

      // 5. Update Lead with conversion info
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          convertedToCustomerId: customer.id,
          convertedToOrganizationId: organizationId || undefined,
          convertedToContactId: contactId || undefined,
          convertedAt: new Date(),
          status: 'CONVERTED' as any, // Update lead status
        },
      });

      return {
        customerId: customer.id,
        organizationId,
        contactId,
        auditId: conversionAudit.id,
      };
    });

    // Audit log (outside transaction)
    await auditLog({
      orgId,
      actorId: userId,
      action: 'convert',
      entityType: 'lead',
      entityId: validated.leadId,
      delta: {
        customerId: result.customerId,
        organizationId: result.organizationId,
        contactId: result.contactId,
      },
    });

    return {
      ...result,
      alreadyConverted: false,
    };
  }

  /**
   * Get conversion history for a lead
   */
  async getLeadConversionHistory(
    orgId: string,
    leadId: string
  ): Promise<any> {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        orgId,
      },
      select: {
        id: true,
        convertedToCustomerId: true,
        convertedToOrganizationId: true,
        convertedToContactId: true,
        convertedAt: true,
        conversionAuditId: true,
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    if (!lead.convertedToCustomerId) {
      return {
        converted: false,
      };
    }

    // Get conversion audit (if available)
    // Note: Lead model doesn't have conversionAuditId field yet
    // This will be added in future migration
    const audit = null;

    return {
      converted: true,
      customerId: lead.convertedToCustomerId,
      organizationId: lead.convertedToOrganizationId,
      contactId: lead.convertedToContactId,
      convertedAt: lead.convertedAt,
      audit: null, // Will be populated when Lead.conversionAuditId field is added
    };
  }

  /**
   * Get all conversions for an organization
   */
  async getConversions(
    orgId: string,
    options: {
      page?: number;
      limit?: number;
      fromDate?: Date;
      toDate?: Date;
    } = {}
  ): Promise<{
    conversions: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;

    const where: any = { orgId };

    if (options.fromDate || options.toDate) {
      where.createdAt = {};
      if (options.fromDate) {
        where.createdAt.gte = options.fromDate;
      }
      if (options.toDate) {
        where.createdAt.lte = options.toDate;
      }
    }

    // TODO: Add conversionAudit model to schema
    const total = 0; // await prisma.conversionAudit.count({ where });

    const conversions: any[] = []; /* await prisma.conversionAudit.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }); */

    return {
      conversions: conversions.map((c) => ({
        id: c.id,
        leadId: c.leadId,
        customerId: c.customerId,
        organizationId: c.organizationId,
        contactId: c.contactId,
        convertedBy: c.convertedBy,
        conversionData: c.conversionData,
        createdAt: c.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}

// Export singleton instance
export const conversionService = new ConversionService();


import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';
import { withAudience } from '@/middleware/audience';

// Zod schema for validation
const LeadConvertSchema = z.object({
  idempotencyKey: z.string().uuid(),
  leadId: z.string(),
  createOrganization: z.boolean().default(true),
  organizationData: z.object({
    name: z.string(),
    domain: z.string().optional(),
    industry: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  createContact: z.boolean().default(true),
  contactData: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    title: z.string().optional(),
  }).optional(),
});

function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    ok: false,
    error: { code: error, message, details },
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }

  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';

  try {
    const validation = LeadConvertSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    const { idempotencyKey, leadId, createOrganization, organizationData, createContact, contactData } = validation.data;

    // Check if lead exists
    const lead = await prisma.lead.findFirst({
      where: { orgId, id: leadId },
    });

    if (!lead) {
      return errorResponse(res, 404, 'NotFound', 'Lead not found');
    }

    // Check if already converted
    if (lead.status === 'CONVERTED' || lead.status === 'WON') {
      return res.status(200).json({
        ok: true,
        data: {
          leadId: lead.id,
          converted: true,
          message: 'Lead already converted',
        },
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      let organizationId: string | undefined;
      let contactId: string | undefined;

      // Create organization if requested
      if (createOrganization && organizationData) {
        const org = await tx.organization.create({
          data: {
            orgId,
            name: organizationData.name,
            domain: organizationData.domain,
            industry: organizationData.industry,
            phone: organizationData.phone,
            ownerId: userId,
          },
        });
        organizationId = org.id;
      }

      // Create contact if requested
      if (createContact && contactData && organizationId) {
        const contact = await tx.contact.create({
          data: {
            orgId,
            organizationId,
            name: contactData.name,
            email: contactData.email,
            phone: contactData.phone,
            title: contactData.title,
            isPrimary: true,
          },
        });
        contactId = contact.id;
      }

      // Update lead status
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 'CONVERTED',
        },
      });

      return {
        leadId: updatedLead.id,
        organizationId,
        contactId,
        converted: true,
      };
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.bridge.lead_convert',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error('Lead conversion error:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to convert lead');
  }
}

export default withAudience('tenant', handler);

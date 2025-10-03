import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ConvertLeadSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    lead_id: z.string(),
    org_name: z.string().min(1),
    contact_role: z.string().optional().default('Primary Contact'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = ConvertLeadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract ID from lead_id
    const leadId = payload.lead_id.replace('LEA-', '');
    if (!leadId) {
      return res.status(400).json({
        error: 'INVALID_LEAD_ID',
        message: 'Lead ID must be in format LEA-000001',
      });
    }

    // Check if lead exists and is convertible
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        orgId,
        archived: false,
      },
    });

    if (!existingLead) {
      return res.status(404).json({
        error: 'LEAD_NOT_FOUND',
        message: 'Lead not found or has been deleted',
      });
    }

    if (existingLead.stage === 'won') {
      return res.status(422).json({
        error: 'LEAD_ALREADY_CONVERTED',
        message: 'Lead has already been converted',
      });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          orgId,
          name: payload.org_name,
        },
      });

      // Create contact
      const contact = await tx.contact.create({
        data: {
          orgId,
          organizationId: organization.id,
          name: existingLead.contactName || 'Unknown',
          email: existingLead.email,
          phone: existingLead.phoneE164,
          isPrimary: true,
        },
      });

      // Update lead status to converted
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          stage: 'won',
          convertedToOrganizationId: organization.id,
          convertedToContactId: contact.id,
        },
      });

      return { organization, contact, updatedLead };
    });

    const leadIdFormatted = `LEA-${result.updatedLead.id.substring(0, 6)}`;
    const orgIdFormatted = `ORG-${result.organization.id.substring(0, 6)}`;
    const contactIdFormatted = `CON-${result.contact.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.lead.convert',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: leadIdFormatted,
        version: 1,
      },
      conversion: {
        lead_id: leadIdFormatted,
        organization_id: orgIdFormatted,
        contact_id: contactIdFormatted,
        organization_name: result.organization.name,
        contact_name: result.contact.name,
        converted_at: result.updatedLead.updatedAt,
      },
      audit_id: `AUD-LEA-${result.updatedLead.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    await auditService.logBinderEvent({
      action: 'crm.lead.convert.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to convert lead',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

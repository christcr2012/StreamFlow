import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateLeadSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    lead_id: z.string(),
    patch: z.object({
      contact_name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
    }),
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
    const validation = UpdateLeadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract ID from lead_id (LEA-000001 -> use as string ID)
    const leadId = payload.lead_id.replace('LEA-', '');
    if (!leadId) {
      return res.status(400).json({
        error: 'INVALID_LEAD_ID',
        message: 'Lead ID must be in format LEA-000001',
      });
    }

    // Check if lead exists
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

    // Check for duplicate email/phone if being updated
    if (payload.patch.email || payload.patch.phone) {
      const duplicateWhere: any = {
        orgId,
        id: { not: leadId },
        archived: false,
        OR: [],
      };

      if (payload.patch.email) {
        duplicateWhere.OR.push({ email: payload.patch.email });
      }
      if (payload.patch.phone) {
        duplicateWhere.OR.push({ phoneE164: payload.patch.phone });
      }

      const duplicateLead = await prisma.lead.findFirst({
        where: duplicateWhere,
      });

      if (duplicateLead) {
        return res.status(422).json({
          error: 'DUPLICATE_LEAD',
          message: 'Another lead with this email or phone already exists',
          existing_lead_id: `LEA-${duplicateLead.id.substring(0, 6)}`,
        });
      }
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(payload.patch.contact_name && { contactName: payload.patch.contact_name }),
        ...(payload.patch.email && { email: payload.patch.email }),
        ...(payload.patch.phone !== undefined && { phoneE164: payload.patch.phone }),
        ...(payload.patch.company !== undefined && { company: payload.patch.company }),
        ...(payload.patch.stage && { stage: payload.patch.stage }),
      },
    });

    const leadIdFormatted = `LEA-${updatedLead.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.lead.update',
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
      lead: {
        id: leadIdFormatted,
        contact_name: updatedLead.contactName,
        email: updatedLead.email,
        phone: updatedLead.phoneE164,
        company: updatedLead.company,
        stage: updatedLead.stage,
        updated_at: updatedLead.updatedAt,
      },
      audit_id: `AUD-LEA-${updatedLead.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    await auditService.logBinderEvent({
      action: 'crm.lead.update.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update lead',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ArchiveLeadSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    lead_id: z.string(),
    reason: z.string().optional(),
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
    const validation = ArchiveLeadSchema.safeParse(req.body);
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
        message: 'Lead not found or already archived',
      });
    }

    // Archive lead
    const archivedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        archived: true,
      },
    });

    const leadIdFormatted = `LEA-${archivedLead.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.lead.archive',
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
        archived: true,
        archived_at: archivedLead.updatedAt,
      },
      audit_id: `AUD-LEA-${archivedLead.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error archiving lead:', error);
    await auditService.logBinderEvent({
      action: 'crm.lead.archive.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to archive lead',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

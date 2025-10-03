import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const RestoreLeadSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    lead_id: z.string(),
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
    const validation = RestoreLeadSchema.safeParse(req.body);
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

    // Check if lead exists and is archived
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        orgId,
        archived: true,
      },
    });

    if (!existingLead) {
      return res.status(404).json({
        error: 'LEAD_NOT_FOUND',
        message: 'Lead not found or not archived',
      });
    }

    // Restore lead
    const restoredLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        archived: false,
      },
    });

    const leadIdFormatted = `LEA-${restoredLead.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.lead.restore',
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
        archived: false,
        restored_at: restoredLead.updatedAt,
      },
      audit_id: `AUD-LEA-${restoredLead.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error restoring lead:', error);
    await auditService.logBinderEvent({
      action: 'crm.lead.restore.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to restore lead',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

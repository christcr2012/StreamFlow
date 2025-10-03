import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddNoteSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    org_id: z.string(),
    content: z.string().min(1),
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
    const validation = AddNoteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract ID from org_id
    const organizationId = payload.org_id.replace('ORG-', '');
    if (!organizationId) {
      return res.status(400).json({
        error: 'INVALID_ORG_ID',
        message: 'Organization ID must be in format ORG-000001',
      });
    }

    // Check if organization exists
    const existingOrg = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        orgId,
        archived: false,
      },
    });

    if (!existingOrg) {
      return res.status(404).json({
        error: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found or has been archived',
      });
    }

    // Create note
    const note = await prisma.note.create({
      data: {
        orgId,
        entityType: 'organization',
        entityId: organizationId,
        userId: userId,
        body: payload.content,
      },
    });

    const noteId = `NOTE-${note.id.substring(0, 6)}`;
    const orgIdFormatted = `ORG-${organizationId.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.organization.note.add',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(201).json({
      status: 'ok',
      result: {
        id: noteId,
        version: 1,
      },
      note: {
        id: noteId,
        org_id: orgIdFormatted,
        content: note.body,
        created_at: note.createdAt,
        created_by: userId,
      },
      audit_id: `AUD-NOTE-${note.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error adding note to organization:', error);
    await auditService.logBinderEvent({
      action: 'crm.organization.note.add.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to add note to organization',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

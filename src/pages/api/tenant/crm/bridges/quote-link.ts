import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';
import { withAudience } from '@/middleware/audience';

// Zod schema for validation
const QuoteLinkSchema = z.object({
  idempotencyKey: z.string().uuid(),
  quoteId: z.string(),
  opportunityId: z.string(),
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
    const validation = QuoteLinkSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    const { idempotencyKey, quoteId, opportunityId } = validation.data;

    // Check for idempotency
    const existing = await prisma.opportunity.findFirst({
      where: {
        orgId,
        id: opportunityId,
      },
    });

    if (existing && existing.sourceLeadId === quoteId) {
      return res.status(200).json({
        ok: true,
        data: {
          opportunityId: existing.id,
          quoteId,
          linked: true,
        },
      });
    }

    // Verify opportunity exists
    if (!existing) {
      return errorResponse(res, 404, 'NotFound', 'Opportunity not found');
    }

    // Update opportunity with quote link
    const updated = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        sourceLeadId: quoteId,
      },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.bridge.quote_link',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      ok: true,
      data: {
        opportunityId: updated.id,
        quoteId,
        linked: true,
      },
    });
  } catch (error) {
    console.error('Quote link error:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to link quote to opportunity');
  }
}

export default withAudience('tenant', handler);

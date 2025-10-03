import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateOpportunitySchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    opp_id: z.string(),
    patch: z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      value: z.number().optional(),
      stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
      probability: z.number().min(0).max(100).optional(),
      expected_close_date: z.string().optional(),
      owner_id: z.string().optional(),
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
    const validation = UpdateOpportunitySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract ID from opp_id
    const opportunityId = payload.opp_id.replace('OPP-', '');
    if (!opportunityId) {
      return res.status(400).json({
        error: 'INVALID_OPP_ID',
        message: 'Opportunity ID must be in format OPP-000001',
      });
    }

    // Check if opportunity exists
    const existingOpp = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        orgId,
      },
    });

    if (!existingOpp) {
      return res.status(404).json({
        error: 'OPPORTUNITY_NOT_FOUND',
        message: 'Opportunity not found or has been archived',
      });
    }

    // Update opportunity
    const updatedOpp = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        ...(payload.patch.name && { title: payload.patch.name }),
        ...(payload.patch.value !== undefined && { estValue: payload.patch.value }),
        ...(payload.patch.stage && { stage: payload.patch.stage }),
        ...(payload.patch.probability !== undefined && { probability: payload.patch.probability }),
        ...(payload.patch.expected_close_date && { closeDate: new Date(payload.patch.expected_close_date) }),
        ...(payload.patch.owner_id !== undefined && { ownerId: payload.patch.owner_id }),
      },
    });

    const oppIdFormatted = `OPP-${updatedOpp.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.opportunity.update',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: oppIdFormatted,
        version: updatedOpp.version,
      },
      opportunity: {
        id: oppIdFormatted,
        name: updatedOpp.title,
        value: updatedOpp.estValue,
        stage: updatedOpp.stage,
        probability: updatedOpp.probability,
        expected_close_date: updatedOpp.closeDate,
        owner_id: updatedOpp.ownerId,
        updated_at: updatedOpp.updatedAt,
      },
      audit_id: `AUD-OPP-${updatedOpp.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    await auditService.logBinderEvent({
      action: 'crm.opportunity.update.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update opportunity',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

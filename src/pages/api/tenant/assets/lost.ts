import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MarkLostSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    asset_id: z.string(),
    lost_reason: z.enum(['theft', 'misplaced', 'damaged_beyond_repair', 'other']),
    description: z.string().min(1),
    last_known_location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
      description: z.string().optional(),
    }).optional(),
    replacement_cost_cents: z.number().int().positive().optional(),
    insurance_claim: z.boolean().default(false),
    police_report_number: z.string().optional(),
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

    const validation = MarkLostSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    const asset = await prisma.asset.findFirst({
      where: {
        id: payload.asset_id.replace('AST-', ''),
        orgId,
      },
    });

    if (!asset) {
      return res.status(404).json({
        error: 'ASSET_NOT_FOUND',
        message: 'Asset not found',
      });
    }

    const currentCustomFields = (asset.customFields as any) || {};
    
    if (currentCustomFields.status === 'lost') {
      return res.status(422).json({
        error: 'ASSET_ALREADY_LOST',
        message: 'Asset is already marked as lost',
      });
    }

    // Create lost report
    const lostReport = await prisma.note.create({
      data: {
        orgId,
        entityType: 'asset',
        entityId: asset.id,
        userId,
        body: `ASSET LOST: ${asset.name} marked as lost. Reason: ${payload.lost_reason}. Description: ${payload.description}${payload.replacement_cost_cents ? `. Replacement cost: $${(payload.replacement_cost_cents / 100).toFixed(2)}` : ''}${payload.insurance_claim ? '. Insurance claim filed.' : ''}${payload.police_report_number ? `. Police report: ${payload.police_report_number}` : ''}`,
        isPinned: true,
      },
    });

    // Update asset status
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        customFields: {
          ...currentCustomFields,
          status: 'lost',
          lost_reason: payload.lost_reason,
          lost_description: payload.description,
          lost_at: new Date().toISOString(),
          lost_by: userId,
          last_known_location: payload.last_known_location,
          replacement_cost_cents: payload.replacement_cost_cents,
          insurance_claim: payload.insurance_claim,
          police_report_number: payload.police_report_number,
          // Clear any checkout info
          checked_out_to: null,
          checked_out_by: null,
          checked_out_at: null,
          work_order_id: null,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'assets.mark_lost',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'manager',
        action: 'mark_asset_lost',
        resource: `asset:${asset.id}`,
        meta: {
          asset_id: payload.asset_id,
          lost_reason: payload.lost_reason,
          description: payload.description,
          replacement_cost_cents: payload.replacement_cost_cents,
          insurance_claim: payload.insurance_claim,
          police_report_number: payload.police_report_number,
          last_known_location: payload.last_known_location,
        },
      },
    });

    const lostReportId = `LOST-${lostReport.id.substring(0, 6)}`;
    const assetIdFormatted = `AST-${asset.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: lostReportId,
        version: 1,
      },
      lost_report: {
        id: lostReportId,
        asset_id: assetIdFormatted,
        asset_name: asset.name,
        lost_reason: payload.lost_reason,
        description: payload.description,
        replacement_cost_cents: payload.replacement_cost_cents,
        replacement_cost_dollars: payload.replacement_cost_cents ? 
          (payload.replacement_cost_cents / 100).toFixed(2) : null,
        insurance_claim: payload.insurance_claim,
        police_report_number: payload.police_report_number,
        last_known_location: payload.last_known_location,
        status: 'lost',
        reported_by: userId,
        reported_at: lostReport.createdAt,
      },
      audit_id: `AUD-LOST-${lostReport.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error marking asset as lost:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to mark asset as lost',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

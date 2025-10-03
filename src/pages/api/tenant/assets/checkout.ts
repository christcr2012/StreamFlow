import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CheckoutAssetSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    asset_id: z.string(),
    checked_out_to: z.string(), // User ID
    work_order_id: z.string().optional(),
    expected_return_date: z.string().datetime().optional(),
    checkout_reason: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }).optional(),
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

    const validation = CheckoutAssetSchema.safeParse(req.body);
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

    // Check if asset is available for checkout
    const currentCustomFields = (asset.customFields as any) || {};
    const currentStatus = currentCustomFields.status || 'available';
    
    if (currentStatus === 'checked_out') {
      return res.status(422).json({
        error: 'ASSET_ALREADY_CHECKED_OUT',
        message: 'Asset is already checked out',
      });
    }

    if (currentStatus === 'lost' || currentStatus === 'out_of_service') {
      return res.status(422).json({
        error: 'ASSET_UNAVAILABLE',
        message: `Asset is ${currentStatus} and cannot be checked out`,
      });
    }

    // Create checkout record
    const checkout = await prisma.note.create({
      data: {
        orgId,
        entityType: 'asset',
        entityId: asset.id,
        userId,
        body: `ASSET CHECKOUT: ${asset.name} checked out to ${payload.checked_out_to}${payload.work_order_id ? ` for work order ${payload.work_order_id}` : ''}${payload.checkout_reason ? `. Reason: ${payload.checkout_reason}` : ''}${payload.expected_return_date ? `. Expected return: ${payload.expected_return_date}` : ''}`,
        isPinned: true,
      },
    });

    // Update asset status
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        customFields: {
          ...currentCustomFields,
          status: 'checked_out',
          checked_out_to: payload.checked_out_to,
          checked_out_by: userId,
          checked_out_at: new Date().toISOString(),
          work_order_id: payload.work_order_id,
          expected_return_date: payload.expected_return_date,
          checkout_reason: payload.checkout_reason,
          checkout_location: payload.location,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'assets.checkout',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'manager',
        action: 'checkout_asset',
        resource: `asset:${asset.id}`,
        meta: {
          asset_id: payload.asset_id,
          checked_out_to: payload.checked_out_to,
          work_order_id: payload.work_order_id,
          expected_return_date: payload.expected_return_date,
          checkout_reason: payload.checkout_reason,
          location: payload.location,
        },
      },
    });

    const checkoutId = `CHECKOUT-${checkout.id.substring(0, 6)}`;
    const assetIdFormatted = `AST-${asset.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: checkoutId,
        version: 1,
      },
      asset_checkout: {
        id: checkoutId,
        asset_id: assetIdFormatted,
        asset_name: asset.name,
        checked_out_to: payload.checked_out_to,
        work_order_id: payload.work_order_id,
        expected_return_date: payload.expected_return_date,
        checkout_reason: payload.checkout_reason,
        status: 'checked_out',
        checked_out_by: userId,
        checked_out_at: checkout.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-CHECKOUT-${checkout.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error checking out asset:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check out asset',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CheckinAssetSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    asset_id: z.string(),
    condition: z.enum(['good', 'fair', 'poor', 'damaged']).default('good'),
    condition_notes: z.string().optional(),
    photos: z.array(z.string()).optional(),
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

    const validation = CheckinAssetSchema.safeParse(req.body);
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
    const currentStatus = currentCustomFields.status || 'available';
    
    if (currentStatus !== 'checked_out') {
      return res.status(422).json({
        error: 'ASSET_NOT_CHECKED_OUT',
        message: 'Asset is not currently checked out',
      });
    }

    // Create checkin record
    const checkin = await prisma.note.create({
      data: {
        orgId,
        entityType: 'asset',
        entityId: asset.id,
        userId,
        body: `ASSET CHECKIN: ${asset.name} checked in by ${userId}. Condition: ${payload.condition}${payload.condition_notes ? `. Notes: ${payload.condition_notes}` : ''}${payload.photos?.length ? `. Photos: ${payload.photos.length}` : ''}`,
        isPinned: payload.condition === 'poor' || payload.condition === 'damaged',
      },
    });

    // Determine new status based on condition
    let newStatus = 'available';
    if (payload.condition === 'damaged' || payload.condition === 'poor') {
      newStatus = 'needs_service';
    }

    // Update asset status
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        customFields: {
          ...currentCustomFields,
          status: newStatus,
          condition: payload.condition,
          condition_notes: payload.condition_notes,
          checked_in_by: userId,
          checked_in_at: new Date().toISOString(),
          checkin_location: payload.location,
          // Clear checkout fields
          checked_out_to: null,
          checked_out_by: null,
          checked_out_at: null,
          work_order_id: null,
          expected_return_date: null,
          checkout_reason: null,
        },
      },
    });

    // Store condition photos if provided
    if (payload.photos && payload.photos.length > 0) {
      for (let i = 0; i < payload.photos.length; i++) {
        const photoId = `PHOTO-CHECKIN-${Date.now()}-${i}`;
        await prisma.asset.create({
          data: {
            orgId,
            name: `checkin_photo_${asset.id}_${i}`,
            category: 'photo',
            assetNumber: photoId,
            qrCode: `QR-${photoId}`,
            customFields: {
              asset_id: asset.id,
              checkin_id: checkin.id,
              photo_type: 'condition',
              condition: payload.condition,
              photo_data: payload.photos[i],
              taken_by: userId,
              taken_at: new Date().toISOString(),
            },
          },
        });
      }
    }

    await auditService.logBinderEvent({
      action: 'assets.checkin',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'checkin_asset',
        resource: `asset:${asset.id}`,
        meta: {
          asset_id: payload.asset_id,
          condition: payload.condition,
          condition_notes: payload.condition_notes,
          photos_count: payload.photos?.length || 0,
          new_status: newStatus,
          location: payload.location,
        },
      },
    });

    const checkinId = `CHECKIN-${checkin.id.substring(0, 6)}`;
    const assetIdFormatted = `AST-${asset.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: checkinId,
        version: 1,
      },
      asset_checkin: {
        id: checkinId,
        asset_id: assetIdFormatted,
        asset_name: asset.name,
        condition: payload.condition,
        condition_notes: payload.condition_notes,
        new_status: newStatus,
        photos_count: payload.photos?.length || 0,
        checked_in_by: userId,
        checked_in_at: checkin.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-CHECKIN-${checkin.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error checking in asset:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check in asset',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Asset Management
const CreateAssetSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    name: z.string(),
    category: z.enum(['vehicle', 'equipment', 'tool', 'part', 'material']),
    asset_number: z.string().optional(),
    serial_number: z.string().optional(),
    model: z.string().optional(),
    manufacturer: z.string().optional(),
    purchase_date: z.string().optional(),
    purchase_price_cents: z.number().positive().optional(),
    location: z.string().optional(),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateAssetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only managers and owners can create assets',
      });
    }

    // Generate asset number if not provided
    const assetNumber = payload.asset_number || `${payload.category.toUpperCase()}-${Date.now()}`;

    // Check for duplicate asset number
    const existingAsset = await prisma.asset.findFirst({
      where: { assetNumber, orgId },
    });

    if (existingAsset) {
      return res.status(409).json({
        error: 'ASSET_EXISTS',
        message: 'Asset with this asset number already exists',
      });
    }

    const asset = await prisma.asset.create({
      data: {
        orgId,
        name: payload.name,
        category: payload.category,
        assetNumber,
        qrCode: `QR-${assetNumber}`,
        status: 'active',
        customFields: {
          serial_number: payload.serial_number,
          model: payload.model,
          manufacturer: payload.manufacturer,
          purchase_date: payload.purchase_date,
          purchase_price_cents: payload.purchase_price_cents,
          location: payload.location,
          condition: payload.condition,
          created_by: actor.user_id,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.asset.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_asset',
        resource: `asset:${asset.id}`,
        meta: { 
          name: payload.name,
          category: payload.category,
          asset_number: assetNumber,
          serial_number: payload.serial_number,
          model: payload.model,
          manufacturer: payload.manufacturer 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `AST-${asset.id.substring(0, 6)}`,
        version: 1,
      },
      asset: {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        asset_number: assetNumber,
        qr_code: asset.qrCode,
        serial_number: payload.serial_number,
        model: payload.model,
        manufacturer: payload.manufacturer,
        purchase_date: payload.purchase_date,
        purchase_price_cents: payload.purchase_price_cents,
        location: payload.location,
        condition: payload.condition,
        status: 'active',
        created_at: asset.createdAt.toISOString(),
      },
      audit_id: `AUD-AST-${asset.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create asset',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

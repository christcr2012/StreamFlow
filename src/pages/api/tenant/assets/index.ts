import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const CreateAssetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['equipment', 'tool', 'vehicle', 'material', 'other']),
  buId: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purchasePrice: z.number().int().optional(),
  purchaseDate: z.string().datetime().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    switch (method) {
      case 'GET': {
        const category = req.query.category as string | undefined;
        const status = req.query.status as string | undefined;
        const buId = req.query.buId as string | undefined;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const where: any = { orgId };
        if (category) where.category = category;
        if (status) where.status = status;
        if (buId) where.buId = buId;

        const [assets, total] = await Promise.all([
          prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          prisma.asset.count({ where }),
        ]);

        res.status(200).json({
          assets,
          total,
          limit,
          offset,
        });
        return;
      }

      case 'POST': {
        const validated = CreateAssetSchema.parse(req.body);

        // Generate asset number
        const assetCount = await prisma.asset.count({ where: { orgId } });
        const assetNumber = `AST-${String(assetCount + 1).padStart(6, '0')}`;

        // Generate QR code
        const qrCode = crypto.randomUUID();

        const asset = await prisma.asset.create({
          data: {
            orgId,
            assetNumber,
            name: validated.name,
            description: validated.description,
            category: validated.category,
            buId: validated.buId,
            qrCode,
            serialNumber: validated.serialNumber,
            manufacturer: validated.manufacturer,
            model: validated.model,
            purchasePrice: validated.purchasePrice,
            purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : undefined,
          },
        });

        // Create history entry
        await prisma.assetHistory.create({
          data: {
            orgId,
            assetId: asset.id,
            userId,
            action: 'create',
            toValue: 'active',
            notes: 'Asset created',
          },
        });

        // Create audit log
        await prisma.auditLog2.create({
          data: {
            orgId,
            userId,
            action: 'create',
            resource: `asset:${asset.id}`,
            meta: {
              assetNumber: asset.assetNumber,
              category: asset.category,
            },
          },
        });

        res.status(201).json(asset);
        return;
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${method} not allowed` });
        return;
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Asset API error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


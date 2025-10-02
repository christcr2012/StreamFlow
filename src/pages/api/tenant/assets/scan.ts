import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ScanAssetSchema = z.object({
  qrCode: z.string().min(1),
  location: z.string().optional(), // GPS coordinates or location description
  notes: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${method} not allowed` });
    return;
  }

  try {
    const validated = ScanAssetSchema.parse(req.body);

    // Find asset by QR code
    const asset = await prisma.asset.findFirst({
      where: {
        qrCode: validated.qrCode,
        orgId,
      },
    });

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    // Create scan history entry
    await prisma.assetHistory.create({
      data: {
        orgId,
        assetId: asset.id,
        userId,
        action: 'scan',
        location: validated.location,
        notes: validated.notes || 'Asset scanned',
      },
    });

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'scan',
        resource: `asset:${asset.id}`,
        meta: {
          qrCode: validated.qrCode,
          location: validated.location,
        },
      },
    });

    res.status(200).json({
      success: true,
      asset: {
        id: asset.id,
        assetNumber: asset.assetNumber,
        name: asset.name,
        category: asset.category,
        status: asset.status,
        assignedToUserId: asset.assignedToUserId,
      },
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Asset scan error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


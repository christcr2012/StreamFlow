import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateLineOfBusinessSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const orgId = req.headers['x-org-id'] as string || 'org_test';

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    // GET - Retrieve line of business
    if (req.method === 'GET') {
      const lineOfBusiness = await prisma.lineOfBusiness.findFirst({
        where: { id, orgId },
        include: {
          businessUnit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!lineOfBusiness) {
        return res.status(404).json({ error: 'Line of business not found' });
      }

      await auditService.logBinderEvent({
        action: 'lob.get',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(200).json({
        ok: true,
        lineOfBusiness,
      });
    }

    // PUT/PATCH - Update line of business
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const validation = UpdateLineOfBusinessSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
      }

      const updateData: any = {};
      if (validation.data.enabled !== undefined) updateData.enabled = validation.data.enabled;
      if (validation.data.config) updateData.config = validation.data.config;

      const lineOfBusiness = await prisma.lineOfBusiness.updateMany({
        where: { id, orgId },
        data: updateData,
      });

      if (lineOfBusiness.count === 0) {
        return res.status(404).json({ error: 'Line of business not found' });
      }

      await auditService.logBinderEvent({
        action: 'lob.update',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      const updated = await prisma.lineOfBusiness.findFirst({
        where: { id, orgId },
      });

      return res.status(200).json({
        ok: true,
        lineOfBusiness: updated,
      });
    }

    // DELETE - Delete line of business
    if (req.method === 'DELETE') {
      const lineOfBusiness = await prisma.lineOfBusiness.findFirst({
        where: { id, orgId },
      });

      if (!lineOfBusiness) {
        return res.status(404).json({ error: 'Line of business not found' });
      }

      await prisma.lineOfBusiness.deleteMany({
        where: { id, orgId },
      });

      await auditService.logBinderEvent({
        action: 'lob.delete',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(200).json({
        ok: true,
        message: 'Line of business deleted',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling line of business:', error);
    await auditService.logBinderEvent({
      action: 'lob.error',
      tenantId: orgId,
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to handle line of business operation',
    });
  }
}

export default withAudience('tenant', handler);


import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateLineOfBusinessSchema = z.object({
  buId: z.string().optional(),
  key: z.string().min(1).max(100),
  enabled: z.boolean().default(false),
  config: z.record(z.unknown()).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = req.headers['x-org-id'] as string || 'org_test';

  try {
    // GET - List lines of business
    if (req.method === 'GET') {
      const buId = req.query.buId as string | undefined;
      const enabled = req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined;

      const where: any = { orgId };
      if (buId) where.buId = buId;
      if (enabled !== undefined) where.enabled = enabled;

      const linesOfBusiness = await prisma.lineOfBusiness.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          businessUnit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await auditService.logBinderEvent({
        action: 'lob.list',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(200).json({
        ok: true,
        linesOfBusiness,
        count: linesOfBusiness.length,
      });
    }

    // POST - Create/enable line of business
    if (req.method === 'POST') {
      const validation = CreateLineOfBusinessSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
      }

      const { buId, key, enabled, config } = validation.data;

      // Check if already exists
      const existing = await prisma.lineOfBusiness.findFirst({
        where: { orgId, key, buId: buId || null },
      });

      if (existing) {
        return res.status(400).json({
          error: 'ALREADY_EXISTS',
          message: 'Line of business already exists for this tenant/BU',
        });
      }

      const lineOfBusiness = await prisma.lineOfBusiness.create({
        data: {
          orgId,
          buId: buId || null,
          key,
          enabled,
          config: (config || {}) as any,
        },
      });

      await auditService.logBinderEvent({
        action: 'lob.create',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(201).json({
        ok: true,
        lineOfBusiness,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling lines of business:', error);
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


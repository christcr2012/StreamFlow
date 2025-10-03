import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateBusinessUnitSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  timezone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const orgId = req.headers['x-org-id'] as string || 'org_test';

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    // GET - Retrieve business unit
    if (req.method === 'GET') {
      const businessUnit = await prisma.businessUnit.findFirst({
        where: { id, orgId },
        include: {
          linesOfBusiness: true,
          fleetVehicles: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              linesOfBusiness: true,
              fleetVehicles: true,
            },
          },
        },
      });

      if (!businessUnit) {
        return res.status(404).json({ error: 'Business unit not found' });
      }

      await auditService.logBinderEvent({
        action: 'bu.get',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(200).json({
        ok: true,
        businessUnit,
      });
    }

    // PUT/PATCH - Update business unit
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const validation = UpdateBusinessUnitSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
      }

      const updateData: any = {};
      if (validation.data.name) updateData.name = validation.data.name;
      if (validation.data.timezone) updateData.timezone = validation.data.timezone;
      if (validation.data.address) updateData.address = validation.data.address;

      const businessUnit = await prisma.businessUnit.updateMany({
        where: { id, orgId },
        data: updateData,
      });

      if (businessUnit.count === 0) {
        return res.status(404).json({ error: 'Business unit not found' });
      }

      await auditService.logBinderEvent({
        action: 'bu.update',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      const updated = await prisma.businessUnit.findFirst({
        where: { id, orgId },
      });

      return res.status(200).json({
        ok: true,
        businessUnit: updated,
      });
    }

    // DELETE - Delete business unit
    if (req.method === 'DELETE') {
      // Check if business unit has associated data
      const businessUnit = await prisma.businessUnit.findFirst({
        where: { id, orgId },
        include: {
          _count: {
            select: {
              linesOfBusiness: true,
              fleetVehicles: true,
            },
          },
        },
      });

      if (!businessUnit) {
        return res.status(404).json({ error: 'Business unit not found' });
      }

      if (businessUnit._count.linesOfBusiness > 0 || businessUnit._count.fleetVehicles > 0) {
        return res.status(400).json({
          error: 'CANNOT_DELETE',
          message: 'Business unit has associated lines of business or vehicles',
          counts: businessUnit._count,
        });
      }

      await prisma.businessUnit.deleteMany({
        where: { id, orgId },
      });

      await auditService.logBinderEvent({
        action: 'bu.delete',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(200).json({
        ok: true,
        message: 'Business unit deleted',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling business unit:', error);
    await auditService.logBinderEvent({
      action: 'bu.error',
      tenantId: orgId,
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to handle business unit operation',
    });
  }
}

export default withAudience('tenant', handler);


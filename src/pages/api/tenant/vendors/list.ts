import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';

    // Filter by roleScope='vendor' using new schema fields
    const vendors = await prisma.user.findMany({
      where: {
        orgId,
        roleScope: 'vendor',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        roleScope: true,
        audience: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'vendor.list',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      ok: true,
      vendors,
      count: vendors.length,
    });
  } catch (error) {
    console.error('Error listing vendors:', error);
    await auditService.logBinderEvent({
      action: 'vendor.list.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to list vendors',
    });
  }
}

export default withAudience('tenant', handler);


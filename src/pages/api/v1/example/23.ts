import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md API Endpoint Example 23
const Example23Schema = z.object({
  id: z.string(),
  payload: z.string(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = Example23Schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: '400_INVALID_23',
        details: validation.error.errors,
      });
    }

    const { id, payload } = validation.data;

    // RBAC check - tenant_manager, tenant_admin
    const userRole = req.headers['x-user-role'] as string;
    if (!['tenant_manager', 'tenant_admin', 'MANAGER', 'OWNER'].includes(userRole)) {
      return res.status(401).json({
        error: '401_UNAUTHORIZED',
        message: 'Insufficient permissions',
      });
    }

    // Create example record
    const exampleRecord = await prisma.note.create({
      data: {
        orgId,
        entityType: 'example_23',
        entityId: id,
        userId: req.headers['x-user-id'] as string || 'system',
        body: `EXAMPLE 23: ${payload}`,
        isPinned: false,
      },
    });

    await auditService.logBinderEvent({
      action: 'api.example.23',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      id: '23',
      result: {
        recordId: exampleRecord.id,
        processed: true,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error in API Endpoint Example 23:', error);
    return res.status(500).json({
      error: '500_INTERNAL',
      message: 'Internal server error',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
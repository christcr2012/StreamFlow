import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const OpenPortalSessionSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string().optional(),
    role: z.string().optional(),
  }),
  payload: z.object({
    token: z.string(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';

    // Validate request body
    const validation = OpenPortalSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Find customer with matching magic link token
    const customers = await prisma.customer.findMany({
      where: { orgId },
    });

    let customer = null;
    let magicLink = null;

    for (const c of customers) {
      try {
        const notes = c.notes ? JSON.parse(c.notes) : {};
        if (notes.magicLink?.token === payload.token) {
          customer = c;
          magicLink = notes.magicLink;
          break;
        }
      } catch (e) {
        // Skip customers with invalid JSON in notes
        continue;
      }
    }

    if (!customer || !magicLink) {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired magic link token',
      });
    }
    
    if (!magicLink || magicLink.used || new Date() > new Date(magicLink.expiresAt)) {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Magic link token has expired or been used',
      });
    }

    // Mark token as used
    const updatedMagicLink = {
      ...magicLink,
      used: true,
      usedAt: new Date().toISOString(),
    };

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        notes: JSON.stringify({ magicLink: updatedMagicLink }),
      },
    });

    // Generate JWT session token
    const sessionToken = jwt.sign(
      {
        customerId: customer.id,
        orgId: customer.orgId,
        email: customer.primaryEmail,
        role: 'customer',
        aud: 'portal',
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    const customerId = `CUS-${customer.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'portal.auth.session.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: customerId,
        version: 1,
      },
      session: {
        token: sessionToken,
        customer_id: customerId,
        email: customer.primaryEmail,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      audit_id: `AUD-CUS-${customer.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    await auditService.logBinderEvent({
      action: 'portal.auth.session.create.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create portal session',
    });
  }
}

export default withAudience(
  'portal',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

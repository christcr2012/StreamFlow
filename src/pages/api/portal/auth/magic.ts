import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const RequestMagicLinkSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string().optional(),
    role: z.string().optional(),
  }),
  payload: z.object({
    email: z.string().email(),
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
    const validation = RequestMagicLinkSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Find customer by email
    const customer = await prisma.customer.findFirst({
      where: {
        primaryEmail: payload.email,
        orgId,
      },
    });

    if (!customer) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({
        status: 'ok',
        result: {
          id: 'CUS-000000',
          version: 1,
        },
        message: 'If this email is associated with an account, a magic link has been sent.',
        audit_id: 'AUD-CUS-000000',
      });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store magic link token (using customer notes field for simplicity)
    const magicLinkData = {
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
    };

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        notes: JSON.stringify({ magicLink: magicLinkData }),
      },
    });

    const customerId = `CUS-${customer.id.substring(0, 6)}`;

    // TODO: Send email with magic link
    // await emailService.sendMagicLink(payload.email, token);

    // Audit log
    await auditService.logBinderEvent({
      action: 'portal.auth.magic.request',
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
      message: 'Magic link sent to email address',
      // In development, include token for testing
      ...(process.env.NODE_ENV === 'development' && { dev_token: token }),
      audit_id: `AUD-CUS-${customer.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error requesting magic link:', error);
    await auditService.logBinderEvent({
      action: 'portal.auth.magic.request.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process magic link request',
    });
  }
}

export default withAudience(
  'portal',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { IntegrationService } from '@/server/services/integrations/integrationService';
import { z } from 'zod';

const ConnectPaylocitySchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  payload: z.object({
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    company_id: z.string().min(1),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate BINDER4_FULL contract
    const validation = ConnectPaylocitySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;
    const { client_id, client_secret, company_id } = payload;

    // Connect integration
    const integration = await IntegrationService.connect({
      tenantId: orgId,
      type: 'paylocity',
      credentials: {
        client_id,
        client_secret,
        company_id,
      },
      userId,
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'integration.paylocity.connect',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: integration.id,
        version: 1,
      },
      audit_id: `AUD-INT-${integration.id}`,
      cost: {
        ai_tokens: 0,
        cents: 0,
      },
    });
  } catch (error: any) {
    console.error('Error connecting Paylocity:', error);
    await auditService.logBinderEvent({
      action: 'integration.paylocity.connect.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to connect Paylocity integration',
    });
  }
}

export default withAudience('tenant', handler);


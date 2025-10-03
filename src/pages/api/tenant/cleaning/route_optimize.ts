import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience } from '@/middleware/audience';
import { withCostGuard } from '@/middleware/costGuard';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';

const RouteOptimizeSchema = z.object({
  tenantId: z.string(),
  requestId: z.string(),
  payload: z.object({}).passthrough(),
  mode: z.enum(['eco', 'full']).optional().default('eco'),
  dryRun: z.boolean().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validated = RouteOptimizeSchema.parse(req.body);
    
    // Check for existing result with same requestId (idempotency)
    const existing = await prisma.cleaning_events.findFirst({
      where: { 
        tenant_id: validated.tenantId,
        request_id: validated.requestId,
        feature: 'route_optimize',
      },
    });

    if (existing) {
      return res.status(200).json({
        ok: true,
        data: existing.result,
      });
    }

    // TODO: Implement actual route optimization logic
    const result = {
      optimizedRoute: [],
      estimatedTime: 0,
      estimatedDistance: 0,
    };

    // Store event
    await prisma.cleaning_events.create({
      data: {
        tenant_id: validated.tenantId,
        feature: 'route_optimize',
        request_id: validated.requestId,
        payload: validated.payload,
        result: result,
        cost_cents: validated.mode === 'full' ? 25 : 10,
        tokens_in: 800,
        tokens_out: 1200,
      },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'cleaning.route_optimize',
      tenantId: validated.tenantId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    console.error('Route optimize error:', error);
    return res.status(500).json({ 
      ok: false,
      errors: ['Internal server error'] 
    });
  }
}

// Apply cost guard with AI token estimation
const withCost = withCostGuard(handler, [
  {
    type: 'ai_tokens',
    estimate: (req) => {
      const body = req.body || {};
      return body.mode === 'full' ? 25 : 10;
    }
  }
]);

export default withAudience('tenant', withCost);

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AutoscaleConfigSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    plan_tier: z.enum(['starter', 'professional', 'enterprise']),
    base_limit: z.number().int().positive(),
    burst_multiplier: z.number().min(1).max(5).default(2),
    p95_threshold_ms: z.number().int().positive().default(1000),
    error_rate_threshold: z.number().min(0).max(1).default(0.01),
    credits_usd: z.number().min(0).default(0),
    auto_scale_enabled: z.boolean().default(true),
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

    const validation = AutoscaleConfigSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Calculate dynamic limits based on ULAP formula
    const baseLimit = payload.base_limit;
    const creditBonus = Math.floor((payload.credits_usd / 10) * baseLimit);
    const burstLimit = Math.min(
      payload.burst_multiplier * baseLimit,
      baseLimit + creditBonus
    );

    // Create or update rate limit configuration using Note model for simplicity
    const rateLimitConfig = await prisma.note.create({
      data: {
        orgId,
        entityType: 'rate_limit',
        entityId: `autoscale-${orgId}`,
        userId,
        body: `ULAP AUTOSCALE CONFIG: Plan: ${payload.plan_tier}, Base: ${baseLimit}, Burst: ${burstLimit}, P95: ${payload.p95_threshold_ms}ms, Error: ${(payload.error_rate_threshold * 100).toFixed(1)}%, Credits: $${payload.credits_usd}, Enabled: ${payload.auto_scale_enabled}`,
        isPinned: true,
      },
    });

    // Log autoscale configuration
    await prisma.note.create({
      data: {
        orgId,
        entityType: 'rate_limit',
        entityId: rateLimitConfig.id,
        userId,
        body: `ULAP AUTOSCALE: Configured rate limits for ${payload.plan_tier} plan. Base: ${baseLimit}, Burst: ${burstLimit}, P95 threshold: ${payload.p95_threshold_ms}ms, Error threshold: ${(payload.error_rate_threshold * 100).toFixed(1)}%, Credits: $${payload.credits_usd}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'ulap.autoscale.configure',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'owner',
        action: 'configure_autoscale',
        resource: `rate_limit:${rateLimitConfig.id}`,
        meta: {
          plan_tier: payload.plan_tier,
          base_limit: baseLimit,
          burst_limit: burstLimit,
          p95_threshold_ms: payload.p95_threshold_ms,
          error_rate_threshold: payload.error_rate_threshold,
          credits_usd: payload.credits_usd,
          auto_scale_enabled: payload.auto_scale_enabled,
        },
      },
    });

    const configId = `ULAP-${rateLimitConfig.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: configId,
        version: 1,
      },
      autoscale_config: {
        id: configId,
        plan_tier: payload.plan_tier,
        base_limit: baseLimit,
        burst_limit: burstLimit,
        current_limit: baseLimit,
        p95_threshold_ms: payload.p95_threshold_ms,
        error_rate_threshold: payload.error_rate_threshold,
        credits_usd: payload.credits_usd,
        auto_scale_enabled: payload.auto_scale_enabled,
        formula_explanation: {
          base: `${baseLimit} (tier base)`,
          credit_bonus: `${creditBonus} (credits/10 * base)`,
          burst: `min(${payload.burst_multiplier} * base, base + credit_bonus) = ${burstLimit}`,
          conditions: [
            `If P95 > ${payload.p95_threshold_ms}ms OR error_rate > ${(payload.error_rate_threshold * 100).toFixed(1)}%: limit = base`,
            `Otherwise: limit can burst up to ${burstLimit}`,
          ],
        },
        configured_by: userId,
        configured_at: rateLimitConfig.createdAt,
      },
      audit_id: `AUD-ULAP-${rateLimitConfig.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error configuring autoscale:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to configure autoscale',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button: Federation — Enable Add-on (line 1788)
const EnableAddonSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    tenant_id: z.string(),
    addon_id: z.string(),
    addon_name: z.string(),
    pricing_tier: z.enum(['basic', 'premium', 'enterprise']).default('basic'),
    trial_days: z.number().positive().default(0),
    auto_billing: z.boolean().default(true),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_org';
    const validation = EnableAddonSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    // Provider-level RBAC check
    if (!['provider_admin', 'provider_engineer'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only provider admins and engineers can enable add-ons',
      });
    }

    // Validate tenant exists
    const tenant = await prisma.org.findFirst({
      where: { id: payload.tenant_id },
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant not found',
      });
    }

    // Check if add-on is already enabled
    const existingAddon = await prisma.note.findFirst({
      where: {
        orgId: payload.tenant_id,
        entityType: 'addon_subscription',
        body: { contains: payload.addon_id },
        isPinned: true, // Active add-ons are pinned
      },
    });

    if (existingAddon) {
      return res.status(409).json({
        error: 'ADDON_ALREADY_ENABLED',
        message: 'Add-on is already enabled for this tenant',
      });
    }

    const addonSubscriptionId = `ADD-${Date.now()}`;
    const trialEndDate = payload.trial_days > 0 
      ? new Date(Date.now() + payload.trial_days * 24 * 60 * 60 * 1000)
      : null;

    // Create add-on subscription
    const addonSubscription = await prisma.note.create({
      data: {
        orgId: payload.tenant_id,
        entityType: 'addon_subscription',
        entityId: addonSubscriptionId,
        userId: actor.user_id,
        body: `ADDON ENABLED: ${payload.addon_name} (${payload.pricing_tier}) for tenant ${payload.tenant_id}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'provider.tenant.enable_addon',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'enable_tenant_addon',
        resource: `addon_subscription:${addonSubscription.id}`,
        meta: { 
          tenant_id: payload.tenant_id,
          addon_id: payload.addon_id,
          addon_name: payload.addon_name,
          pricing_tier: payload.pricing_tier,
          trial_days: payload.trial_days,
          auto_billing: payload.auto_billing,
          trial_end_date: trialEndDate?.toISOString() 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `FED-${addonSubscription.id.substring(0, 6)}`,
        version: 1,
      },
      addon_subscription: {
        id: addonSubscription.id,
        subscription_id: addonSubscriptionId,
        tenant_id: payload.tenant_id,
        tenant_name: tenant.name,
        addon_id: payload.addon_id,
        addon_name: payload.addon_name,
        pricing_tier: payload.pricing_tier,
        status: trialEndDate ? 'trial' : 'active',
        trial_days: payload.trial_days,
        trial_end_date: trialEndDate?.toISOString(),
        auto_billing: payload.auto_billing,
        enabled_at: addonSubscription.createdAt.toISOString(),
        enabled_by: actor.user_id,
        next_billing_date: trialEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      },
      audit_id: `AUD-FED-${addonSubscription.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error enabling add-on:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to enable add-on',
    });
  }
}

export default withAudience('provider', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

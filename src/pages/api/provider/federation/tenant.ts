import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 2: Federation — Create Tenant (line 1591)
const CreateTenantSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    tenant_name: z.string(),
    admin_email: z.string().email(),
    domain: z.string(),
    plan: z.enum(['starter', 'professional', 'enterprise']),
    features: z.array(z.string()),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_test';
    const validation = CreateTenantSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    // Check if domain is already taken
    const existingTenant = await prisma.user.findFirst({
      where: { 
        email: payload.admin_email,
        audience: 'tenant',
      },
    });

    if (existingTenant) {
      return res.status(409).json({
        error: 'TENANT_EXISTS',
        message: 'Tenant with this email already exists',
      });
    }

    const newTenantId = `tenant_${Date.now()}`;

    // Create tenant admin user
    const tenantAdmin = await prisma.user.create({
      data: {
        orgId: newTenantId,
        name: payload.tenant_name,
        email: payload.admin_email,
        role: 'OWNER',
        roleScope: 'tenant',
        audience: 'tenant',
        status: 'active',
        metadata: {
          domain: payload.domain,
          plan: payload.plan,
          features: payload.features,
          created_by_provider: actor.user_id,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'provider.federation.create_tenant',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: 'provider',
        action: 'create_tenant',
        resource: `tenant:${newTenantId}`,
        meta: { 
          tenant_name: payload.tenant_name,
          admin_email: payload.admin_email,
          domain: payload.domain,
          plan: payload.plan,
          features: payload.features 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `TEN-${tenantAdmin.id.substring(0, 6)}`,
        version: 1,
      },
      tenant: {
        tenant_id: newTenantId,
        name: payload.tenant_name,
        admin_email: payload.admin_email,
        domain: payload.domain,
        plan: payload.plan,
        features: payload.features,
        status: 'active',
        created_at: new Date().toISOString(),
      },
      audit_id: `AUD-TEN-${tenantAdmin.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create tenant',
    });
  }
}

export default withAudience('provider', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button: Federation — Create Tenant (line 1591)
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
    plan: z.enum(['starter', 'professional', 'enterprise']).default('starter'),
    trial_days: z.number().positive().default(14),
    admin_email: z.string().email(),
    industry: z.string().optional(),
    company_size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_org';
    const validation = CreateTenantSchema.safeParse(req.body);
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
        message: 'Only provider admins and engineers can create tenants',
      });
    }

    // Check if tenant name is already taken
    const existingTenant = await prisma.org.findFirst({
      where: { name: payload.tenant_name },
    });

    if (existingTenant) {
      return res.status(409).json({
        error: 'TENANT_NAME_TAKEN',
        message: 'Tenant name is already taken',
      });
    }

    const tenantId = `TEN-${Date.now()}`;
    const trialEndDate = new Date(Date.now() + payload.trial_days * 24 * 60 * 60 * 1000);

    // Create tenant organization
    const tenant = await prisma.org.create({
      data: {
        id: tenantId,
        name: payload.tenant_name,
      },
    });

    // Create admin user for the tenant
    const adminUser = await prisma.user.create({
      data: {
        orgId: tenantId,
        email: payload.admin_email,
        role: 'OWNER',
        roleScope: 'employee',
        audience: 'tenant',
        status: 'active',
        metadata: {
          account_type: 'tenant_admin',
          created_by: actor.user_id,
          trial_end_date: trialEndDate.toISOString(),
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'provider.tenant.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_tenant',
        resource: `tenant:${tenant.id}`,
        meta: { 
          tenant_name: payload.tenant_name,
          plan: payload.plan,
          trial_days: payload.trial_days,
          admin_email: payload.admin_email,
          industry: payload.industry,
          company_size: payload.company_size,
          admin_user_id: adminUser.id 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `FED-${tenant.id.substring(0, 6)}`,
        version: 1,
      },
      tenant: {
        id: tenant.id,
        tenant_id: tenantId,
        tenant_name: payload.tenant_name,
        plan: payload.plan,
        status: 'trial',
        trial_days: payload.trial_days,
        trial_end_date: trialEndDate.toISOString(),
        industry: payload.industry,
        company_size: payload.company_size,
        admin_user: {
          id: adminUser.id,
          email: payload.admin_email,
          role: 'tenant_owner',
        },
        subdomain: `${payload.tenant_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.streamflow.app`,
        created_at: tenant.createdAt.toISOString(),
        created_by: actor.user_id,
      },
      audit_id: `AUD-FED-${tenant.id.substring(0, 6)}`,
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

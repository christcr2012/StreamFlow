import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button: Federation — Create Provider Account (line 1552)
const CreateProviderAccountSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    account_name: z.string(),
    admin_email: z.string().email(),
    plan: z.enum(['starter', 'professional', 'enterprise']).default('starter'),
    region: z.string().default('us-east-1'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_org';
    const validation = CreateProviderAccountSchema.safeParse(req.body);
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
        message: 'Only provider admins and engineers can create provider accounts',
      });
    }

    // Check if account name is already taken
    const existingAccount = await prisma.org.findFirst({
      where: { name: payload.account_name },
    });

    if (existingAccount) {
      return res.status(409).json({
        error: 'ACCOUNT_NAME_TAKEN',
        message: 'Provider account name is already taken',
      });
    }

    const accountId = `PRV-${Date.now()}`;

    // Create provider account
    const providerAccount = await prisma.org.create({
      data: {
        id: accountId,
        name: payload.account_name,
      },
    });

    // Create admin user for the provider account
    const adminUser = await prisma.user.create({
      data: {
        orgId: accountId,
        email: payload.admin_email,
        role: 'OWNER',
        roleScope: 'provider',
        audience: 'provider',
        status: 'active',
        metadata: {
          account_type: 'provider_admin',
          created_by: actor.user_id,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'provider.account.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_provider_account',
        resource: `provider_account:${providerAccount.id}`,
        meta: { 
          account_name: payload.account_name,
          admin_email: payload.admin_email,
          plan: payload.plan,
          region: payload.region,
          admin_user_id: adminUser.id 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `PRV-${providerAccount.id.substring(0, 6)}`,
        version: 1,
      },
      provider_account: {
        id: providerAccount.id,
        account_id: accountId,
        account_name: payload.account_name,
        plan: payload.plan,
        region: payload.region,
        status: 'active',
        admin_user: {
          id: adminUser.id,
          email: payload.admin_email,
          role: 'provider_admin',
        },
        created_at: providerAccount.createdAt.toISOString(),
        created_by: actor.user_id,
      },
      audit_id: `AUD-PRV-${providerAccount.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating provider account:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create provider account',
    });
  }
}

export default withAudience('provider', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

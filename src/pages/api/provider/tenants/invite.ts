import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 3: Federation — Invite Tenant Admin (line 1631)
const InviteTenantAdminSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    tenant_id: z.string(),
    email: z.string().email(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_org';
    const validation = InviteTenantAdminSchema.safeParse(req.body);
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
        message: 'Only provider admins and engineers can invite tenant admins',
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

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: payload.email, orgId: payload.tenant_id },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'USER_ALREADY_EXISTS',
        message: 'User with this email already exists in the tenant',
      });
    }

    const inviteId = `INV-${Date.now()}`;

    // Create invitation record
    const invitation = await prisma.note.create({
      data: {
        orgId,
        entityType: 'tenant_invitation',
        entityId: inviteId,
        userId: actor.user_id,
        body: `TENANT ADMIN INVITATION: ${payload.email} for tenant ${payload.tenant_id}`,
        isPinned: true,
      },
    });

    // Generate invitation token (simplified)
    const invitationToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    await auditService.logBinderEvent({
      action: 'provider.tenant.invite_admin',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'invite_tenant_admin',
        resource: `tenant_invitation:${invitation.id}`,
        meta: { 
          tenant_id: payload.tenant_id,
          email: payload.email,
          invitation_token: invitationToken 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `FED-${invitation.id.substring(0, 6)}`,
        version: 1,
      },
      invitation: {
        id: invitation.id,
        invitation_id: inviteId,
        tenant_id: payload.tenant_id,
        tenant_name: tenant.name,
        email: payload.email,
        invitation_token: invitationToken,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        invited_by: actor.user_id,
        created_at: invitation.createdAt.toISOString(),
      },
      audit_id: `AUD-FED-${invitation.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error inviting tenant admin:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to invite tenant admin',
    });
  }
}

export default withAudience('provider', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

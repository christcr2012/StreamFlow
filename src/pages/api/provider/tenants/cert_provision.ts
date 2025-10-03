import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button: Federation — Provision Cert (ACME) (line 1710)
const ProvisionCertSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    tenant_id: z.string(),
    domain: z.string(),
    cert_type: z.enum(['wildcard', 'single']).default('single'),
    auto_renew: z.boolean().default(true),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_org';
    const validation = ProvisionCertSchema.safeParse(req.body);
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
        message: 'Only provider admins and engineers can provision certificates',
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

    // Check if certificate already exists for this domain
    const existingCert = await prisma.note.findFirst({
      where: {
        orgId,
        entityType: 'ssl_certificate',
        body: { contains: payload.domain },
      },
    });

    if (existingCert) {
      return res.status(409).json({
        error: 'CERTIFICATE_EXISTS',
        message: 'Certificate already exists for this domain',
      });
    }

    const certId = `CERT-${Date.now()}`;

    // Simulate ACME certificate provisioning
    const certificateData = {
      certificate_id: certId,
      domain: payload.domain,
      cert_type: payload.cert_type,
      status: 'provisioning',
      acme_challenge: {
        type: 'http-01',
        token: `tok_${Math.random().toString(36).substring(2)}`,
        key_authorization: `key_${Math.random().toString(36).substring(2)}`,
      },
      auto_renew: payload.auto_renew,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    };

    // Create certificate record
    const certificate = await prisma.note.create({
      data: {
        orgId,
        entityType: 'ssl_certificate',
        entityId: certId,
        userId: actor.user_id,
        body: `SSL CERTIFICATE: ${payload.domain} for tenant ${payload.tenant_id} (${payload.cert_type})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'provider.tenant.provision_certificate',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'provision_ssl_certificate',
        resource: `ssl_certificate:${certificate.id}`,
        meta: { 
          tenant_id: payload.tenant_id,
          domain: payload.domain,
          cert_type: payload.cert_type,
          auto_renew: payload.auto_renew,
          certificate_data: certificateData 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `FED-${certificate.id.substring(0, 6)}`,
        version: 1,
      },
      certificate: {
        id: certificate.id,
        certificate_id: certId,
        tenant_id: payload.tenant_id,
        tenant_name: tenant.name,
        domain: payload.domain,
        cert_type: payload.cert_type,
        status: 'provisioning',
        acme_challenge: certificateData.acme_challenge,
        auto_renew: payload.auto_renew,
        expires_at: certificateData.expires_at,
        verification_instructions: `Place the following file at http://${payload.domain}/.well-known/acme-challenge/${certificateData.acme_challenge.token} with content: ${certificateData.acme_challenge.key_authorization}`,
        created_at: certificate.createdAt.toISOString(),
      },
      audit_id: `AUD-FED-${certificate.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error provisioning certificate:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to provision certificate',
    });
  }
}

export default withAudience('provider', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

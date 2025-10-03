import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 4: Federation — Link Domain (CNAME/TXT) (line 1670)
const LinkDomainSchema = z.object({
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
    method: z.enum(['CNAME', 'TXT']),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_org';
    const validation = LinkDomainSchema.safeParse(req.body);
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
        message: 'Only provider admins and engineers can link domains',
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

    // Check if domain is already linked
    const existingDomain = await prisma.note.findFirst({
      where: {
        orgId,
        entityType: 'domain_link',
        body: { contains: payload.domain },
      },
    });

    if (existingDomain) {
      return res.status(409).json({
        error: 'DOMAIN_ALREADY_LINKED',
        message: 'Domain is already linked to a tenant',
      });
    }

    const domainLinkId = `DOM-${Date.now()}`;

    // Generate DNS records based on method
    const dnsRecords = payload.method === 'CNAME' 
      ? {
          type: 'CNAME',
          name: payload.domain,
          value: `${payload.tenant_id}.streamflow.app`,
          ttl: 300,
        }
      : {
          type: 'TXT',
          name: `_streamflow.${payload.domain}`,
          value: `streamflow-verification=${payload.tenant_id}`,
          ttl: 300,
        };

    // Create domain link record
    const domainLink = await prisma.note.create({
      data: {
        orgId,
        entityType: 'domain_link',
        entityId: domainLinkId,
        userId: actor.user_id,
        body: `DOMAIN LINK: ${payload.domain} → ${payload.tenant_id} (${payload.method})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'provider.tenant.link_domain',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'link_tenant_domain',
        resource: `domain_link:${domainLink.id}`,
        meta: { 
          tenant_id: payload.tenant_id,
          domain: payload.domain,
          method: payload.method,
          dns_records: dnsRecords 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `FED-${domainLink.id.substring(0, 6)}`,
        version: 1,
      },
      domain_link: {
        id: domainLink.id,
        domain_link_id: domainLinkId,
        tenant_id: payload.tenant_id,
        tenant_name: tenant.name,
        domain: payload.domain,
        method: payload.method,
        dns_records: dnsRecords,
        status: 'pending_verification',
        verification_instructions: payload.method === 'CNAME' 
          ? `Create a CNAME record: ${payload.domain} → ${payload.tenant_id}.streamflow.app`
          : `Create a TXT record: _streamflow.${payload.domain} → streamflow-verification=${payload.tenant_id}`,
        created_at: domainLink.createdAt.toISOString(),
      },
      audit_id: `AUD-FED-${domainLink.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error linking domain:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to link domain',
    });
  }
}

export default withAudience('provider', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

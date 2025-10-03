import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DomainLinkSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    domain: z.string().min(1),
    method: z.enum(['cname', 'txt', 'http']).default('cname'),
    subdomain: z.string().optional(),
    ssl_enabled: z.boolean().default(true),
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

    const validation = DomainLinkSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Check if domain is already linked
    const existingDomain = await prisma.tenantDomain.findFirst({
      where: {
        domain: payload.domain,
      },
    });

    if (existingDomain && existingDomain.orgId !== orgId) {
      return res.status(422).json({
        error: 'DOMAIN_ALREADY_LINKED',
        message: 'Domain is already linked to another tenant',
      });
    }

    // Generate verification tokens/records
    const verificationToken = `streamflow-verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const cnameTarget = `${orgId}.streamflow.app`;
    
    let verificationInstructions;
    switch (payload.method) {
      case 'cname':
        verificationInstructions = {
          type: 'CNAME',
          name: payload.subdomain ? `${payload.subdomain}.${payload.domain}` : payload.domain,
          value: cnameTarget,
          ttl: 300,
        };
        break;
      case 'txt':
        verificationInstructions = {
          type: 'TXT',
          name: `_streamflow-challenge.${payload.domain}`,
          value: verificationToken,
          ttl: 300,
        };
        break;
      case 'http':
        verificationInstructions = {
          type: 'HTTP',
          url: `http://${payload.domain}/.well-known/streamflow-challenge`,
          content: verificationToken,
        };
        break;
    }

    // Create or update domain linking record
    const domainLink = await prisma.tenantDomain.upsert({
      where: {
        orgId: orgId,
      },
      update: {
        domain: payload.domain,
        subdomain: payload.subdomain || `tenant-${orgId}`,
        txtRecord: verificationToken,
        verified: false,
        sslEnabled: payload.ssl_enabled,
        updatedAt: new Date(),
      },
      create: {
        orgId,
        domain: payload.domain,
        subdomain: payload.subdomain || `tenant-${orgId}`,
        txtRecord: verificationToken,
        verified: false,
        sslEnabled: payload.ssl_enabled,
      },
    });

    // Create domain linking log
    await prisma.note.create({
      data: {
        orgId,
        entityType: 'domain',
        entityId: domainLink.id,
        userId,
        body: `DOMAIN LINKING: Started domain verification for ${payload.domain} using ${payload.method.toUpperCase()} method. Verification token: ${verificationToken}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'branding.domain_link',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'owner',
        action: 'link_domain',
        resource: `domain:${domainLink.id}`,
        meta: {
          domain: payload.domain,
          method: payload.method,
          subdomain: payload.subdomain,
          ssl_enabled: payload.ssl_enabled,
          verification_token: verificationToken,
        },
      },
    });

    const domainLinkId = `DOMAIN-${domainLink.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: domainLinkId,
        version: 1,
      },
      domain_link: {
        id: domainLinkId,
        domain: payload.domain,
        subdomain: payload.subdomain,
        method: payload.method,
        verification_status: 'pending',
        ssl_enabled: payload.ssl_enabled,
        verification_instructions: verificationInstructions,
        verification_timeout: '15 minutes',
        next_steps: [
          `Add ${verificationInstructions.type} record to your DNS`,
          'Wait for DNS propagation (up to 15 minutes)',
          'Verification will be checked automatically',
          'SSL certificate will be provisioned upon verification',
        ],
        created_at: domainLink.createdAt,
      },
      audit_id: `AUD-DOMAIN-${domainLink.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error linking domain:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to link domain',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

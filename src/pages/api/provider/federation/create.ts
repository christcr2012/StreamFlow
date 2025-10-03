import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateProviderAccountSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    provider_name: z.string().min(1),
    provider_email: z.string().email(),
    provider_domain: z.string().optional(),
    service_types: z.array(z.string()),
    coverage_areas: z.array(z.string()),
    contact_info: z.object({
      phone: z.string().optional(),
      address: z.string().optional(),
      website: z.string().optional(),
    }).optional(),
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

    const validation = CreateProviderAccountSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Check if provider already exists
    const existingProvider = await prisma.user.findFirst({
      where: {
        email: payload.provider_email,
        audience: 'provider',
      },
    });

    if (existingProvider) {
      return res.status(422).json({
        error: 'PROVIDER_EXISTS',
        message: 'Provider account already exists with this email',
      });
    }

    // Create provider account
    const provider = await prisma.user.create({
      data: {
        email: payload.provider_email,
        name: payload.provider_name,
        role: 'OWNER', // Provider is owner of their own account
        orgId: `provider_${Date.now()}`, // Unique org for provider
        roleScope: 'provider',
        audience: 'provider',
        status: 'active',
        metadata: {
          provider_domain: payload.provider_domain,
          service_types: payload.service_types,
          coverage_areas: payload.coverage_areas,
          contact_info: payload.contact_info,
          created_by: userId,
          created_at: new Date().toISOString(),
          federation_status: 'pending_verification',
        },
      },
    });

    // Create federation record
    const federation = await prisma.note.create({
      data: {
        orgId,
        entityType: 'provider',
        entityId: provider.id,
        userId,
        body: `PROVIDER FEDERATION: Created provider account for ${payload.provider_name} (${payload.provider_email}). Service types: ${payload.service_types.join(', ')}. Coverage: ${payload.coverage_areas.join(', ')}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'federation.provider.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'provider_admin',
        action: 'create_provider',
        resource: `provider:${provider.id}`,
        meta: {
          provider_name: payload.provider_name,
          provider_email: payload.provider_email,
          service_types: payload.service_types,
          coverage_areas: payload.coverage_areas,
          provider_domain: payload.provider_domain,
        },
      },
    });

    const providerId = `PROV-${provider.id.substring(0, 6)}`;
    const federationId = `FED-${federation.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: providerId,
        version: 1,
      },
      provider_account: {
        id: providerId,
        provider_name: payload.provider_name,
        provider_email: payload.provider_email,
        provider_domain: payload.provider_domain,
        service_types: payload.service_types,
        coverage_areas: payload.coverage_areas,
        contact_info: payload.contact_info,
        federation_status: 'pending_verification',
        created_by: userId,
        created_at: provider.createdAt,
      },
      federation: {
        id: federationId,
        status: 'created',
        next_steps: [
          'Verify email address',
          'Complete provider profile',
          'Set up domain linking',
          'Configure service offerings',
        ],
      },
      audit_id: `AUD-PROV-${provider.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating provider account:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create provider account',
    });
  }
}

export default withAudience(
  'provider',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);

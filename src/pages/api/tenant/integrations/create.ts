import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Integration Management
const CreateIntegrationSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    integration_name: z.string(),
    integration_type: z.enum(['crm', 'accounting', 'inventory', 'payroll', 'communication', 'mapping', 'payment', 'custom']),
    provider: z.string(),
    description: z.string().optional(),
    configuration: z.object({
      api_endpoint: z.string().optional(),
      api_key: z.string().optional(),
      webhook_url: z.string().optional(),
      sync_frequency: z.enum(['real_time', 'hourly', 'daily', 'weekly', 'manual']).default('daily'),
      data_mapping: z.array(z.object({
        source_field: z.string(),
        target_field: z.string(),
        transformation: z.string().optional(),
      })).default([]),
      filters: z.array(z.object({
        field: z.string(),
        condition: z.string(),
        value: z.any(),
      })).default([]),
    }),
    sync_direction: z.enum(['inbound', 'outbound', 'bidirectional']),
    data_types: z.array(z.enum(['customers', 'work_orders', 'invoices', 'payments', 'inventory', 'employees', 'assets'])),
    authentication: z.object({
      type: z.enum(['api_key', 'oauth2', 'basic_auth', 'token']),
      credentials: z.record(z.string()).optional(),
    }),
    error_handling: z.object({
      retry_attempts: z.number().min(0).max(10).default(3),
      retry_delay_seconds: z.number().min(1).max(3600).default(60),
      notification_email: z.string().email().optional(),
    }).default({}),
    active: z.boolean().default(false),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateIntegrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only managers and owners can create integrations',
      });
    }

    // Validate data mapping
    if (payload.configuration.data_mapping.length === 0 && payload.sync_direction !== 'manual') {
      return res.status(400).json({
        error: 'MISSING_DATA_MAPPING',
        message: 'Data mapping is required for automated sync',
      });
    }

    // Validate data types
    if (payload.data_types.length === 0) {
      return res.status(400).json({
        error: 'NO_DATA_TYPES',
        message: 'Integration must specify at least one data type',
      });
    }

    // Check for duplicate integration name
    const existingIntegration = await prisma.note.findFirst({
      where: {
        orgId,
        entityType: 'integration',
        body: { contains: payload.integration_name },
      },
    });

    if (existingIntegration) {
      return res.status(409).json({
        error: 'INTEGRATION_EXISTS',
        message: 'Integration with this name already exists',
      });
    }

    const integrationId = `INT-${Date.now()}`;

    const integration = await prisma.note.create({
      data: {
        orgId,
        entityType: 'integration',
        entityId: integrationId,
        userId: actor.user_id,
        body: `INTEGRATION: ${payload.integration_name} - ${payload.provider} (${payload.integration_type}, ${payload.sync_direction})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.integration.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_integration',
        resource: `integration:${integration.id}`,
        meta: { 
          integration_name: payload.integration_name,
          integration_type: payload.integration_type,
          provider: payload.provider,
          sync_direction: payload.sync_direction,
          data_types: payload.data_types,
          active: payload.active 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `INT-${integration.id.substring(0, 6)}`,
        version: 1,
      },
      integration: {
        id: integration.id,
        integration_id: integrationId,
        integration_name: payload.integration_name,
        integration_type: payload.integration_type,
        provider: payload.provider,
        description: payload.description,
        configuration: {
          ...payload.configuration,
          api_key: payload.configuration.api_key ? '[REDACTED]' : undefined, // Hide sensitive data
        },
        sync_direction: payload.sync_direction,
        data_types: payload.data_types,
        authentication: {
          type: payload.authentication.type,
          credentials: payload.authentication.credentials ? '[REDACTED]' : undefined, // Hide sensitive data
        },
        error_handling: payload.error_handling,
        active: payload.active,
        status: 'configured',
        last_sync: null,
        created_at: integration.createdAt.toISOString(),
      },
      audit_id: `AUD-INT-${integration.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating integration:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create integration',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

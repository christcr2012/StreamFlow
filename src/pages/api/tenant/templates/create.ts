import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Template Management
const CreateTemplateSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    name: z.string(),
    description: z.string().optional(),
    template_type: z.enum(['email', 'sms', 'document', 'report', 'invoice', 'estimate', 'work_order', 'contract', 'checklist']),
    category: z.string(),
    content: z.object({
      subject: z.string().optional(),
      body: z.string(),
      variables: z.array(z.object({
        name: z.string(),
        type: z.enum(['text', 'number', 'date', 'boolean', 'list']),
        required: z.boolean().default(false),
        default_value: z.any().optional(),
        description: z.string().optional(),
      })).default([]),
      formatting: z.object({
        font_family: z.string().optional(),
        font_size: z.number().optional(),
        colors: z.object({
          primary: z.string().optional(),
          secondary: z.string().optional(),
          text: z.string().optional(),
        }).optional(),
        layout: z.enum(['single_column', 'two_column', 'three_column', 'custom']).optional(),
      }).optional(),
    }),
    usage_permissions: z.object({
      roles: z.array(z.enum(['EMPLOYEE', 'MANAGER', 'OWNER'])).default(['MANAGER', 'OWNER']),
      departments: z.array(z.string()).default([]),
      specific_users: z.array(z.string()).default([]),
    }).default({}),
    approval_required: z.boolean().default(false),
    version_control: z.boolean().default(true),
    tags: z.array(z.string()).default([]),
    active: z.boolean().default(true),
    compliance_notes: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateTemplateSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create templates',
      });
    }

    // Validate template content
    if (!payload.content.body || payload.content.body.trim().length === 0) {
      return res.status(400).json({
        error: 'EMPTY_CONTENT',
        message: 'Template content body cannot be empty',
      });
    }

    // Validate specific users if specified
    if (payload.usage_permissions.specific_users.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: payload.usage_permissions.specific_users }, orgId },
      });

      if (users.length !== payload.usage_permissions.specific_users.length) {
        return res.status(404).json({
          error: 'USERS_NOT_FOUND',
          message: 'One or more specified users not found',
        });
      }
    }

    // Check for duplicate template name in same category
    const existingTemplate = await prisma.note.findFirst({
      where: {
        orgId,
        entityType: 'template',
        body: { contains: `${payload.name} - ${payload.category}` },
      },
    });

    if (existingTemplate) {
      return res.status(409).json({
        error: 'TEMPLATE_EXISTS',
        message: 'Template with this name already exists in this category',
      });
    }

    const templateId = `TPL-${Date.now()}`;

    const template = await prisma.note.create({
      data: {
        orgId,
        entityType: 'template',
        entityId: templateId,
        userId: actor.user_id,
        body: `TEMPLATE: ${payload.name} - ${payload.description} (${payload.template_type}, ${payload.category})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.template.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_template',
        resource: `template:${template.id}`,
        meta: { 
          name: payload.name,
          template_type: payload.template_type,
          category: payload.category,
          variables_count: payload.content.variables.length,
          approval_required: payload.approval_required,
          version_control: payload.version_control 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `TPL-${template.id.substring(0, 6)}`,
        version: 1,
      },
      template: {
        id: template.id,
        template_id: templateId,
        name: payload.name,
        description: payload.description,
        template_type: payload.template_type,
        category: payload.category,
        content: payload.content,
        variables_count: payload.content.variables.length,
        usage_permissions: payload.usage_permissions,
        approval_required: payload.approval_required,
        version_control: payload.version_control,
        tags: payload.tags,
        active: payload.active,
        compliance_notes: payload.compliance_notes,
        status: 'active',
        version: '1.0',
        usage_count: 0,
        last_used: null,
        created_at: template.createdAt.toISOString(),
      },
      audit_id: `AUD-TPL-${template.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create template',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

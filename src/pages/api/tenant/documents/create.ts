import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Document Management
const CreateDocumentSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    title: z.string(),
    description: z.string().optional(),
    document_type: z.enum(['contract', 'invoice', 'estimate', 'work_order', 'compliance', 'training', 'policy', 'manual', 'certificate', 'other']),
    category: z.string().optional(),
    file_name: z.string(),
    file_size_bytes: z.number().positive(),
    file_type: z.string(),
    file_url: z.string().url(),
    related_entity: z.object({
      type: z.enum(['customer', 'work_order', 'project', 'employee', 'asset', 'vendor']).optional(),
      id: z.string().optional(),
    }).optional(),
    access_level: z.enum(['public', 'internal', 'restricted', 'confidential']).default('internal'),
    permissions: z.object({
      view: z.array(z.string()).default([]),
      edit: z.array(z.string()).default([]),
      delete: z.array(z.string()).default([]),
    }).default({}),
    tags: z.array(z.string()).default([]),
    version: z.string().default('1.0'),
    expiration_date: z.string().optional(),
    retention_period_months: z.number().positive().optional(),
    compliance_requirements: z.array(z.string()).default([]),
    digital_signature_required: z.boolean().default(false),
    approval_workflow: z.object({
      required: z.boolean().default(false),
      approvers: z.array(z.string()).default([]),
      current_step: z.number().default(0),
    }).default({}),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateDocumentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['EMPLOYEE', 'MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    // Validate file size (max 50MB)
    if (payload.file_size_bytes > 50 * 1024 * 1024) {
      return res.status(413).json({
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds 50MB limit',
      });
    }

    // Validate related entity if provided
    if (payload.related_entity?.type && payload.related_entity?.id) {
      let entityExists = false;
      
      switch (payload.related_entity.type) {
        case 'customer':
          entityExists = !!(await prisma.customer.findFirst({
            where: { id: payload.related_entity.id, orgId },
          }));
          break;
        case 'work_order':
          entityExists = !!(await prisma.workOrder.findFirst({
            where: { id: payload.related_entity.id, orgId },
          }));
          break;
        case 'employee':
          entityExists = !!(await prisma.user.findFirst({
            where: { id: payload.related_entity.id, orgId },
          }));
          break;
      }

      if (!entityExists) {
        return res.status(404).json({
          error: 'RELATED_ENTITY_NOT_FOUND',
          message: `Related ${payload.related_entity.type} not found`,
        });
      }
    }

    // Validate approvers if approval workflow is required
    if (payload.approval_workflow.required && payload.approval_workflow.approvers.length > 0) {
      const approvers = await prisma.user.findMany({
        where: { id: { in: payload.approval_workflow.approvers }, orgId, role: { in: ['MANAGER', 'OWNER'] } },
      });

      if (approvers.length !== payload.approval_workflow.approvers.length) {
        return res.status(404).json({
          error: 'APPROVERS_NOT_FOUND',
          message: 'One or more approvers not found or insufficient permissions',
        });
      }
    }

    const documentId = `DOC-${Date.now()}`;

    const document = await prisma.note.create({
      data: {
        orgId,
        entityType: 'document',
        entityId: documentId,
        userId: actor.user_id,
        body: `DOCUMENT: ${payload.title} - ${payload.description} (${payload.document_type}, ${payload.file_type})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.document.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_document',
        resource: `document:${document.id}`,
        meta: { 
          title: payload.title,
          document_type: payload.document_type,
          file_name: payload.file_name,
          file_size_bytes: payload.file_size_bytes,
          access_level: payload.access_level,
          related_entity: payload.related_entity 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `DOC-${document.id.substring(0, 6)}`,
        version: 1,
      },
      document: {
        id: document.id,
        document_id: documentId,
        title: payload.title,
        description: payload.description,
        document_type: payload.document_type,
        category: payload.category,
        file_name: payload.file_name,
        file_size_bytes: payload.file_size_bytes,
        file_size_mb: (payload.file_size_bytes / (1024 * 1024)).toFixed(2),
        file_type: payload.file_type,
        file_url: payload.file_url,
        related_entity: payload.related_entity,
        access_level: payload.access_level,
        permissions: payload.permissions,
        tags: payload.tags,
        version: payload.version,
        expiration_date: payload.expiration_date,
        retention_period_months: payload.retention_period_months,
        compliance_requirements: payload.compliance_requirements,
        digital_signature_required: payload.digital_signature_required,
        approval_workflow: payload.approval_workflow,
        status: payload.approval_workflow.required ? 'pending_approval' : 'active',
        uploaded_by: actor.user_id,
        created_at: document.createdAt.toISOString(),
      },
      audit_id: `AUD-DOC-${document.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create document',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

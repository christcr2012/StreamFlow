import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Project Management
const CreateProjectSchema = z.object({
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
    customer_id: z.string(),
    project_type: z.enum(['installation', 'maintenance', 'repair', 'inspection', 'consultation']),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
    start_date: z.string(),
    end_date: z.string().optional(),
    budget_cents: z.number().positive().optional(),
    project_manager_id: z.string(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    tags: z.array(z.string()).default([]),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateProjectSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create projects',
      });
    }

    // Validate customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: payload.customer_id, orgId },
    });

    if (!customer) {
      return res.status(404).json({
        error: 'CUSTOMER_NOT_FOUND',
        message: 'Customer not found',
      });
    }

    // Validate project manager exists
    const projectManager = await prisma.user.findFirst({
      where: { id: payload.project_manager_id, orgId },
    });

    if (!projectManager) {
      return res.status(404).json({
        error: 'PROJECT_MANAGER_NOT_FOUND',
        message: 'Project manager not found',
      });
    }

    const projectNumber = `PRJ-${Date.now()}`;

    const project = await prisma.note.create({
      data: {
        orgId,
        entityType: 'project',
        entityId: projectNumber,
        userId: actor.user_id,
        body: `PROJECT: ${payload.name} - ${payload.description} (${payload.project_type}, ${payload.status})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.project.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_project',
        resource: `project:${project.id}`,
        meta: { 
          name: payload.name,
          customer_id: payload.customer_id,
          project_type: payload.project_type,
          status: payload.status,
          start_date: payload.start_date,
          budget_cents: payload.budget_cents,
          project_manager_id: payload.project_manager_id 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `PRJ-${project.id.substring(0, 6)}`,
        version: 1,
      },
      project: {
        id: project.id,
        project_number: projectNumber,
        name: payload.name,
        description: payload.description,
        customer_id: payload.customer_id,
        customer_name: customer.primaryName || customer.company || 'Unknown',
        project_type: payload.project_type,
        status: payload.status,
        start_date: payload.start_date,
        end_date: payload.end_date,
        budget_cents: payload.budget_cents,
        budget_usd: payload.budget_cents ? (payload.budget_cents / 100).toFixed(2) : null,
        project_manager_id: payload.project_manager_id,
        project_manager_name: projectManager.name,
        priority: payload.priority,
        tags: payload.tags,
        created_at: project.createdAt.toISOString(),
      },
      audit_id: `AUD-PRJ-${project.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create project',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

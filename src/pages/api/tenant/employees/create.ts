import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Employee Management
const CreateEmployeeSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.enum(['EMPLOYEE', 'MANAGER']),
    department: z.string().optional(),
    hire_date: z.string(),
    hourly_rate_cents: z.number().positive().optional(),
    skills: z.array(z.string()).default([]),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateEmployeeSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create employees',
      });
    }

    // Check for duplicate employee
    const existingEmployee = await prisma.user.findFirst({
      where: { email: payload.email, orgId },
    });

    if (existingEmployee) {
      return res.status(409).json({
        error: 'EMPLOYEE_EXISTS',
        message: 'Employee with this email already exists',
      });
    }

    const employee = await prisma.user.create({
      data: {
        orgId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        roleScope: 'employee',
        audience: 'tenant',
        status: 'active',
        metadata: {
          phone: payload.phone,
          department: payload.department,
          hire_date: payload.hire_date,
          hourly_rate_cents: payload.hourly_rate_cents,
          skills: payload.skills,
          created_by: actor.user_id,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.employee.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_employee',
        resource: `employee:${employee.id}`,
        meta: { 
          name: payload.name,
          email: payload.email,
          role: payload.role,
          department: payload.department,
          hire_date: payload.hire_date 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `EMP-${employee.id.substring(0, 6)}`,
        version: 1,
      },
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: (employee.metadata as any)?.phone,
        role: employee.role,
        department: payload.department,
        hire_date: payload.hire_date,
        hourly_rate_cents: payload.hourly_rate_cents,
        skills: payload.skills,
        status: 'active',
        created_at: employee.createdAt.toISOString(),
      },
      audit_id: `AUD-EMP-${employee.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create employee',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

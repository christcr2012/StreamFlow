import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Customer Management
const CreateCustomerSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
    }),
    customer_type: z.enum(['residential', 'commercial']),
    billing_address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
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
    const validation = CreateCustomerSchema.safeParse(req.body);
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

    // Check for duplicate customer
    if (payload.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { primaryEmail: payload.email, orgId },
      });

      if (existingCustomer) {
        return res.status(409).json({
          error: 'CUSTOMER_EXISTS',
          message: 'Customer with this email already exists',
        });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        orgId,
        publicId: `CUS-${Date.now()}`,
        company: payload.name,
        primaryName: payload.name,
        primaryEmail: payload.email,
        primaryPhone: payload.phone,
        notes: `Customer Type: ${payload.customer_type}, Address: ${JSON.stringify(payload.address)}`,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.customer.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_customer',
        resource: `customer:${customer.id}`,
        meta: { 
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          customer_type: payload.customer_type,
          address: payload.address 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `CUS-${customer.id.substring(0, 6)}`,
        version: 1,
      },
      customer: {
        id: customer.id,
        name: customer.primaryName,
        email: customer.primaryEmail,
        phone: customer.primaryPhone,
        address: payload.address,
        customer_type: payload.customer_type,
        billing_address: payload.billing_address || payload.address,
        status: 'active',
        created_at: customer.createdAt.toISOString(),
      },
      audit_id: `AUD-CUS-${customer.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create customer',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

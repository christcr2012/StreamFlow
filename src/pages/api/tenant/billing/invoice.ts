import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Billing & Invoicing
const CreateInvoiceSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    customer_id: z.string(),
    work_order_id: z.string().optional(),
    line_items: z.array(z.object({
      description: z.string(),
      quantity: z.number().positive(),
      unit_price_cents: z.number().positive(),
      tax_rate: z.number().min(0).max(1).default(0),
    })),
    due_date: z.string(),
    notes: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['MANAGER', 'OWNER', 'ACCOUNTANT'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only managers, owners, and accountants can create invoices',
      });
    }

    const customer = await prisma.customer.findFirst({
      where: { id: payload.customer_id, orgId },
    });

    if (!customer) {
      return res.status(404).json({
        error: 'CUSTOMER_NOT_FOUND',
        message: 'Customer not found',
      });
    }

    // Calculate totals
    let subtotalCents = 0;
    let totalTaxCents = 0;

    for (const item of payload.line_items) {
      const lineTotal = item.quantity * item.unit_price_cents;
      const lineTax = Math.round(lineTotal * item.tax_rate);
      subtotalCents += lineTotal;
      totalTaxCents += lineTax;
    }

    const totalCents = subtotalCents + totalTaxCents;
    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        orgId,
        customerId: payload.customer_id,
        amount: totalCents / 100, // Convert cents to decimal
        status: 'draft',
        items: payload.line_items,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.billing.create_invoice',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_invoice',
        resource: `invoice:${invoice.id}`,
        meta: { 
          customer_id: payload.customer_id,
          work_order_id: payload.work_order_id,
          invoice_number: invoiceNumber,
          total_cents: totalCents,
          due_date: payload.due_date 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `INV-${invoice.id.substring(0, 6)}`,
        version: 1,
      },
      invoice: {
        id: invoice.id,
        invoice_number: `INV-${invoice.id.substring(0, 6)}`,
        customer_id: payload.customer_id,
        customer_name: customer.primaryName || customer.company || 'Unknown',
        subtotal_cents: subtotalCents,
        tax_cents: totalTaxCents,
        total_cents: totalCents,
        subtotal_usd: (subtotalCents / 100).toFixed(2),
        tax_usd: (totalTaxCents / 100).toFixed(2),
        total_usd: (totalCents / 100).toFixed(2),
        due_date: payload.due_date,
        status: 'draft',
        line_items: payload.line_items,
        created_at: invoice.issuedAt.toISOString(),
      },
      audit_id: `AUD-INV-${invoice.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create invoice',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

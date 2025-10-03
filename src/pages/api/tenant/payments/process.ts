import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Payment Processing
const ProcessPaymentSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    invoice_id: z.string(),
    payment_method: z.enum(['credit_card', 'debit_card', 'ach', 'check', 'cash']),
    amount_cents: z.number().positive(),
    payment_reference: z.string().optional(),
    notes: z.string().optional(),
    payment_date: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = ProcessPaymentSchema.safeParse(req.body);
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
        message: 'Only managers, owners, and accountants can process payments',
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: payload.invoice_id, orgId },
    });

    if (!invoice) {
      return res.status(404).json({
        error: 'INVOICE_NOT_FOUND',
        message: 'Invoice not found',
      });
    }

    const invoiceAmountCents = Number(invoice.amount) * 100;

    if (payload.amount_cents > invoiceAmountCents) {
      return res.status(400).json({
        error: 'PAYMENT_EXCEEDS_INVOICE',
        message: 'Payment amount exceeds invoice total',
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orgId,
        invoiceId: payload.invoice_id,
        amount: payload.amount_cents / 100, // Convert to decimal
        method: payload.payment_method,
        reference: payload.payment_reference,
        receivedAt: payload.payment_date ? new Date(payload.payment_date) : new Date(),
      },
    });

    // Update invoice status if fully paid
    const totalPayments = await prisma.payment.aggregate({
      where: { invoiceId: payload.invoice_id },
      _sum: { amount: true },
    });

    const totalPaidCents = Number(totalPayments._sum?.amount || 0) * 100;
    const newInvoiceStatus = totalPaidCents >= invoiceAmountCents ? 'paid' : 'partial';

    await prisma.invoice.update({
      where: { id: payload.invoice_id },
      data: { status: newInvoiceStatus },
    });

    await auditService.logBinderEvent({
      action: 'tenant.payment.process',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'process_payment',
        resource: `payment:${payment.id}`,
        meta: { 
          invoice_id: payload.invoice_id,
          payment_method: payload.payment_method,
          amount_cents: payload.amount_cents,
          payment_reference: payload.payment_reference 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `PAY-${payment.id.substring(0, 6)}`,
        version: 1,
      },
      payment: {
        id: payment.id,
        invoice_id: payload.invoice_id,
        payment_method: payload.payment_method,
        amount_cents: payload.amount_cents,
        amount_usd: (payload.amount_cents / 100).toFixed(2),
        payment_reference: payload.payment_reference,
        notes: payload.notes,
        payment_date: payment.receivedAt.toISOString(),
        status: 'completed',
        invoice_status: newInvoiceStatus,
      },
      audit_id: `AUD-PAY-${payment.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process payment',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));

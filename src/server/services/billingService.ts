import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateQuoteSchema = z.object({
  customer_id: z.string().min(1),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
  })),
  valid_until: z.string().datetime().optional(),
});

const CreateInvoiceSchema = z.object({
  customer_id: z.string().min(1),
  amount: z.number().positive(),
  due_date: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
  })).optional(),
});

const RecordPaymentSchema = z.object({
  invoice_id: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().default('stripe'),
  reference: z.string().optional(),
});

export class BillingService {
  async createQuote(orgId: string, userId: string, data: z.infer<typeof CreateQuoteSchema>) {
    const validated = CreateQuoteSchema.parse(data);

    const total = validated.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );

    const quote = await prisma.quote.create({
      data: {
        orgId,
        customerId: validated.customer_id,
        title: 'Quote',
        subtotal: total,
        total,
        status: 'draft',
        createdBy: userId,
        validUntil: validated.valid_until ? new Date(validated.valid_until) : undefined,
        items: validated.items as any,
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'create',
        resource: `quote:${quote.id}`,
        meta: {
          customer_id: validated.customer_id,
          total,
          item_count: validated.items.length,
        },
      },
    });

    return quote;
  }

  async acceptQuote(orgId: string, userId: string, quoteId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, orgId },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'draft' && quote.status !== 'sent') {
      throw new Error('Quote cannot be accepted');
    }

    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'accept',
        resource: `quote:${quoteId}`,
        meta: {},
      },
    });

    return updated;
  }

  async createInvoice(orgId: string, userId: string, data: z.infer<typeof CreateInvoiceSchema>) {
    const validated = CreateInvoiceSchema.parse(data);

    const invoice = await prisma.invoice.create({
      data: {
        orgId,
        customerId: validated.customer_id,
        amount: validated.amount,
        status: 'draft',
        issuedAt: new Date(),
        items: validated.items as any,
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'create',
        resource: `invoice:${invoice.id}`,
        meta: {
          customer_id: validated.customer_id,
          amount: validated.amount,
        },
      },
    });

    return invoice;
  }

  async sendInvoice(orgId: string, userId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, orgId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
        issuedAt: new Date(),
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'send',
        resource: `invoice:${invoiceId}`,
        meta: {},
      },
    });

    return updated;
  }

  async recordPayment(orgId: string, userId: string, data: z.infer<typeof RecordPaymentSchema>) {
    const validated = RecordPaymentSchema.parse(data);

    const invoice = await prisma.invoice.findFirst({
      where: { id: validated.invoice_id, orgId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payment = await prisma.payment.create({
      data: {
        orgId,
        invoiceId: validated.invoice_id,
        amount: validated.amount,
        method: validated.method,
        reference: validated.reference,
        receivedAt: new Date(),
      },
    });

    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId: validated.invoice_id },
      _sum: { amount: true },
    });

    const paidAmount = Number(totalPaid._sum.amount || 0);
    const invoiceAmount = Number(invoice.amount);

    if (paidAmount >= invoiceAmount) {
      await prisma.invoice.update({
        where: { id: validated.invoice_id },
        data: { status: 'paid' },
      });
    } else {
      await prisma.invoice.update({
        where: { id: validated.invoice_id },
        data: { status: 'partial' },
      });
    }

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'payment',
        resource: `invoice:${validated.invoice_id}`,
        meta: {
          payment_id: payment.id,
          amount: validated.amount,
          method: validated.method,
        },
      },
    });

    return payment;
  }

  async refundPayment(orgId: string, userId: string, paymentId: string, amount?: number) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, orgId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const refundAmount = amount || Number(payment.amount);

    const refund = await prisma.payment.create({
      data: {
        orgId,
        invoiceId: payment.invoiceId,
        amount: -refundAmount,
        method: payment.method,
        reference: `Refund for ${payment.id}`,
        receivedAt: new Date(),
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'refund',
        resource: `payment:${paymentId}`,
        meta: {
          refund_id: refund.id,
          amount: refundAmount,
        },
      },
    });

    return refund;
  }

  async getInvoiceBalance(orgId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, orgId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payments = await prisma.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });

    const totalPaid = Number(payments._sum.amount || 0);
    const invoiceAmount = Number(invoice.amount);
    const balance = invoiceAmount - totalPaid;

    return {
      invoice_id: invoiceId,
      invoice_amount: invoiceAmount,
      total_paid: totalPaid,
      balance,
      status: invoice.status,
    };
  }
}

export const billingService = new BillingService();


import { z } from 'zod';

export const InvoiceLineSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive(),
  taxRate: z.number().min(0).max(1).default(0),
});

export const CreateInvoiceSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  jobId: z.string().cuid('Invalid job ID').optional(),
  lines: z.array(InvoiceLineSchema).min(1, 'At least one line item is required'),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  dueDate: z.string().datetime().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export const CreatePaymentSchema = z.object({
  invoiceId: z.string().cuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['stripe', 'cash', 'check', 'bank_transfer']).default('stripe'),
  reference: z.string().optional(),
});

export const InvoiceFilterSchema = z.object({
  status: z.enum(['draft', 'open', 'paid', 'void', 'overdue']).optional(),
  customerId: z.string().cuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type InvoiceFilterInput = z.infer<typeof InvoiceFilterSchema>;
export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;


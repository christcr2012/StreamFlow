import { z } from 'zod';
import { ImportEntityType } from '@prisma/client';

// Shared helpers
const E164 = /^\+\d{7,15}$/;
const ISO_CURRENCY = /^[A-Z]{3}$/;

export const customerSchema = z.object({
  company: z.string().min(1).optional(),
  primaryName: z.string().min(1).optional(),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().regex(E164, 'Invalid E.164 phone').optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(v => !!(v.company || v.primaryName), {
  message: 'Either company or primaryName is required',
  path: ['primaryName'],
});

export const jobSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
  assignedTo: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  location: z
    .object({ lat: z.number().optional(), lng: z.number().optional(), address: z.string().optional() })
    .partial()
    .optional(),
  notes: z.string().optional(),
});

export const invoiceSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: 'amount must be a number' }),
  subtotal: z.coerce.number().optional(),
  taxAmount: z.coerce.number().optional(),
  discountAmount: z.coerce.number().optional(),
  currency: z.string().regex(ISO_CURRENCY, 'currency must be a 3-letter ISO code').optional(),
  status: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  items: z.array(z.any()).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

export function getEntitySchema(type: ImportEntityType) {
  switch (type) {
    case ImportEntityType.CUSTOMERS:
      return customerSchema;
    case ImportEntityType.JOBS:
      return jobSchema;
    case ImportEntityType.INVOICES:
      return invoiceSchema;
    default:
      return null;
  }
}


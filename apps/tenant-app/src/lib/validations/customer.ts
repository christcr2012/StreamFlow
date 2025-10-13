import { z } from 'zod';

export const CustomerContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export const CreateCustomerSchema = z.object({
  company: z.string().optional(),
  primaryName: z.string().min(1, 'Primary contact name is required'),
  primaryEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  primaryPhone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  billingSettings: z.record(z.unknown()).default({}),
  contacts: z.array(CustomerContactSchema).default([]),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerFilterSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CustomerFilterInput = z.infer<typeof CustomerFilterSchema>;
export type CustomerContact = z.infer<typeof CustomerContactSchema>;


import { z } from 'zod';

export const CreateAgreementTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  verticalKey: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  mergeFields: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const UpdateAgreementTemplateSchema = CreateAgreementTemplateSchema.partial();

export const CreateAgreementSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  templateId: z.string().cuid('Invalid template ID'),
  variables: z.record(z.string()).default({}),
});

export const UpdateAgreementSchema = z.object({
  status: z.enum(['draft', 'sent', 'signed', 'expired', 'cancelled']).optional(),
  signedAt: z.string().datetime().optional(),
  signedBy: z.string().optional(),
  renewalAt: z.string().datetime().optional(),
});

export const AgreementFilterSchema = z.object({
  customerId: z.string().cuid().optional(),
  status: z.enum(['draft', 'sent', 'signed', 'expired', 'cancelled']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateAgreementTemplateInput = z.infer<typeof CreateAgreementTemplateSchema>;
export type UpdateAgreementTemplateInput = z.infer<typeof UpdateAgreementTemplateSchema>;
export type CreateAgreementInput = z.infer<typeof CreateAgreementSchema>;
export type UpdateAgreementInput = z.infer<typeof UpdateAgreementSchema>;
export type AgreementFilterInput = z.infer<typeof AgreementFilterSchema>;


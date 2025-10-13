import { z } from 'zod';

export const ConvertLeadSchema = z.object({
  leadId: z.string().cuid('Invalid lead ID'),
  createJob: z.boolean().default(false),
  jobTitle: z.string().optional(),
  jobScheduledAt: z.string().datetime().optional(),
});

export const LeadFilterSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).optional(),
  sourceType: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ConvertLeadInput = z.infer<typeof ConvertLeadSchema>;
export type LeadFilterInput = z.infer<typeof LeadFilterSchema>;


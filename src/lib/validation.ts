// src/lib/validation.ts
import { z } from "zod";

export const CreateLeadSchema = z.object({
  sourceType: z.string().optional().nullable(),
  sourceDetail: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phoneE164: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  serviceCode: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

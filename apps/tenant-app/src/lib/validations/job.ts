import { z } from 'zod';

export const JobLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
});

export const CreateJobSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID').optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).default('scheduled'),
  scheduledAt: z.string().datetime().optional(),
  assignees: z.array(z.string().cuid()).default([]),
  location: JobLocationSchema.optional(),
  notes: z.string().optional(),
});

export const UpdateJobSchema = CreateJobSchema.partial();

export const UpdateJobStatusSchema = z.object({
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']),
  note: z.string().optional(),
});

export const UploadJobPhotoSchema = z.object({
  jobId: z.string().cuid(),
  url: z.string().url(),
  metadata: z.record(z.unknown()).default({}),
  takenAt: z.string().datetime().optional(),
  takenBy: z.string().optional(),
});

export const JobFilterSchema = z.object({
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).optional(),
  customerId: z.string().cuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof UpdateJobStatusSchema>;
export type UploadJobPhotoInput = z.infer<typeof UploadJobPhotoSchema>;
export type JobFilterInput = z.infer<typeof JobFilterSchema>;
export type JobLocation = z.infer<typeof JobLocationSchema>;


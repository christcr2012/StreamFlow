import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience } from '@/middleware/audience';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';

const JobCreateSchema = z.object({
  title: z.string(),
  scheduledAt: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }),
  notes: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validated = JobCreateSchema.parse(req.body);
    
    // Get tenant ID from token
    const tenantId = req.headers['x-org-id'] as string || 'org_test';
    
    // Create job ticket
    const job = await prisma.jobTicket.create({
      data: {
        orgId: tenantId,
        customerId: 'cust_default', // TODO: Get from request or create
        serviceType: validated.title,
        scheduledAt: new Date(validated.scheduledAt),
        location: validated.location,
        metadata: { notes: validated.notes },
        status: 'scheduled',
      },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'job_create',
      tenantId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      jobId: job.id,
      status: 'scheduled',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    console.error('Job creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAudience('tenant', handler);

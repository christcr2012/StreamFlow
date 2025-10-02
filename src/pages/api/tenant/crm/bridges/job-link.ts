import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Zod schemas for validation
const JobLinkSchema = z.object({
  idempotencyKey: z.string().uuid(),
  jobId: z.string(),
  organizationId: z.string().optional(),
  primaryContactId: z.string().optional(),
  opportunityId: z.string().optional(),
});

function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }

  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';

  try {
    const validation = JobLinkSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    const { idempotencyKey, jobId, organizationId, primaryContactId, opportunityId } = validation.data;

    // Check if job exists
    const job = await prisma.jobTicket.findFirst({
      where: { orgId, id: jobId },
    });

    if (!job) {
      return errorResponse(res, 404, 'NotFound', 'Job not found');
    }

    // Check if already linked
    if (job.organizationId || job.contactId || job.opportunityId) {
      // Check if it's the same link (idempotency)
      if (
        job.organizationId === organizationId &&
        job.contactId === primaryContactId &&
        job.opportunityId === opportunityId
      ) {
        return res.status(200).json({
          ok: true,
          data: {
            jobId: job.id,
            organizationId: job.organizationId,
            primaryContactId: job.contactId,
            opportunityId: job.opportunityId,
          },
        });
      }
      return errorResponse(res, 409, 'Conflict', 'Job already linked to CRM entities');
    }

    // Verify CRM entities exist if provided
    if (organizationId) {
      const orgExists = await prisma.customer.findFirst({
        where: { orgId, id: organizationId },
      });
      if (!orgExists) {
        return errorResponse(res, 404, 'NotFound', 'Organization not found');
      }
    }

    if (primaryContactId) {
      const contactExists = await prisma.contact.findFirst({
        where: { orgId, id: primaryContactId },
      });
      if (!contactExists) {
        return errorResponse(res, 404, 'NotFound', 'Contact not found');
      }
    }

    if (opportunityId) {
      const oppExists = await prisma.opportunity.findFirst({
        where: { orgId, id: opportunityId },
      });
      if (!oppExists) {
        return errorResponse(res, 404, 'NotFound', 'Opportunity not found');
      }
    }

    // Update job with CRM links
    const updatedJob = await prisma.jobTicket.update({
      where: { id: jobId },
      data: {
        organizationId: organizationId || null,
        contactId: primaryContactId || null,
        opportunityId: opportunityId || null,
      },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'update',
      entityType: 'job_crm_link',
      entityId: jobId,
      delta: { organizationId, primaryContactId, opportunityId },
    });

    return res.status(200).json({
      ok: true,
      data: {
        jobId: updatedJob.id,
        organizationId: updatedJob.organizationId,
        primaryContactId: updatedJob.contactId,
        opportunityId: updatedJob.opportunityId,
      },
    });
  } catch (error) {
    console.error('Error linking job to CRM:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to link job to CRM');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


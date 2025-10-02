import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Validation schema for updates
const updateOpportunitySchema = z.object({
  title: z.string().min(1).optional(),
  estValue: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  closeDate: z.string().datetime().optional(),
  stage: z.string().optional(),
  ownerId: z.string().optional(),
});

// Error envelope helper
function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any): void {
  res.status(status).json({
    error,
    message,
    details,
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';
  const { id } = req.query;

  if (typeof id !== 'string') {
    errorResponse(res, 400, 'BadRequest', 'Invalid opportunity ID');
    return;
  }

  if (req.method === 'GET') {
    return handleGet(req, res, orgId, id);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, orgId, userId, id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, orgId, userId, id);
  } else {
    errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
    return;
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string, id: string): Promise<void> {
  try {
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id,
        orgId,
      },
      include: {
        customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
          },
        },
      },
    });

    if (!opportunity) {
      errorResponse(res, 404, 'NotFound', 'Opportunity not found');
      return;
    }

    // Get related jobs (Bridge System)
    const jobs = await prisma.jobTicket.findMany({
      where: {
        orgId,
        opportunityId: id,
      },
      select: {
        id: true,
        serviceType: true,
        status: true,
        scheduledAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // TODO: Get related quotes when Quote model is implemented

    // Transform response
    const response = {
      id: opportunity.id,
      title: opportunity.title,
      customerId: opportunity.customerId,
      customerName: opportunity.customer ? (opportunity.customer.company || opportunity.customer.primaryName) : undefined,
      valueType: opportunity.valueType,
      estValue: opportunity.estValue ? Number(opportunity.estValue) : undefined,
      stage: opportunity.stage,
      probability: opportunity.probability,
      closeDate: opportunity.closeDate?.toISOString(),
      ownerId: opportunity.ownerId,
      leadId: opportunity.leadId,
      createdAt: opportunity.createdAt.toISOString(),
      updatedAt: opportunity.updatedAt.toISOString(),
      jobs: jobs.map((job) => ({
        id: job.id,
        serviceType: job.serviceType,
        status: job.status,
        scheduledAt: job.scheduledAt?.toISOString(),
      })),
      quotes: [], // TODO: Add when Quote model is implemented
      notes: [], // TODO: Add when Activity model is implemented
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    errorResponse(res, 500, 'Internal', 'Failed to fetch opportunity');
    return;
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string): Promise<void> {
  try {
    // Validate request body
    const data = updateOpportunitySchema.parse(req.body);

    // Check if opportunity exists
    const existing = await prisma.opportunity.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!existing) {
      errorResponse(res, 404, 'NotFound', 'Opportunity not found');
      return;
    }

    // Update opportunity
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.estValue !== undefined && { estValue: data.estValue }),
        ...(data.probability !== undefined && { probability: data.probability }),
        ...(data.closeDate && { closeDate: new Date(data.closeDate) }),
        ...(data.stage && { stage: data.stage }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      },
      include: {
        customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
          },
        },
      },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'update',
      entityType: 'opportunity',
      entityId: id,
      delta: data,
    });

    // Transform response
    const response = {
      id: opportunity.id,
      title: opportunity.title,
      customerId: opportunity.customerId,
      customerName: opportunity.customer ? (opportunity.customer.company || opportunity.customer.primaryName) : undefined,
      valueType: opportunity.valueType,
      estValue: opportunity.estValue ? Number(opportunity.estValue) : undefined,
      stage: opportunity.stage,
      probability: opportunity.probability,
      closeDate: opportunity.closeDate?.toISOString(),
      ownerId: opportunity.ownerId,
      leadId: opportunity.leadId,
      createdAt: opportunity.createdAt.toISOString(),
      updatedAt: opportunity.updatedAt.toISOString(),
    };

    return res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const field = err.path[0]?.toString() || 'unknown';
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      errorResponse(res, 422, 'UnprocessableEntity', 'Validation failed', fieldErrors);
      return;
    }
    console.error('Error updating opportunity:', error);
    errorResponse(res, 500, 'Internal', 'Failed to update opportunity');
    return;
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string): Promise<void> {
  try {
    // Check if opportunity exists
    const existing = await prisma.opportunity.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!existing) {
      errorResponse(res, 404, 'NotFound', 'Opportunity not found');
      return;
    }

    // Delete opportunity
    await prisma.opportunity.delete({
      where: { id },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'delete',
      entityType: 'opportunity',
      entityId: id,
      delta: {},
    });

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    errorResponse(res, 500, 'Internal', 'Failed to delete opportunity');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


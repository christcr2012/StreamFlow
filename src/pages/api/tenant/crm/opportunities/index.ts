import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';

// Validation schemas
const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  customerId: z.string().min(1, 'Customer is required'),
  estValue: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  closeDate: z.string().datetime().optional(),
  stage: z.string().default('prospecting'),
  ownerId: z.string().optional(),
  leadId: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('20'),
  query: z.string().optional(),
  stage: z.string().optional(),
  owner: z.string().optional(),
});

// Error envelope helper
function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Add withAudience middleware (Task 3)
  // For now, mock auth
  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';

  if (req.method === 'GET') {
    return handleGet(req, res, orgId);
  } else if (req.method === 'POST') {
    return handlePost(req, res, orgId, userId);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  try {
    // Validate query params
    const query = querySchema.parse(req.query);

    // Build where clause
    const where: any = { orgId };

    if (query.query) {
      where.title = {
        contains: query.query,
        mode: 'insensitive',
      };
    }

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.owner) {
      where.ownerId = query.owner;
    }

    // Get total count
    const total = await prisma.opportunity.count({ where });

    // Get paginated results
    const opportunities = await prisma.opportunity.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
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

    // Transform response
    const transformed = opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      customerId: opp.customerId,
      customerName: opp.customer.company || opp.customer.primaryName,
      valueType: opp.valueType,
      estValue: opp.estValue ? Number(opp.estValue) : undefined,
      stage: opp.stage,
      probability: opp.probability,
      closeDate: opp.closeDate?.toISOString(),
      ownerId: opp.ownerId,
      leadId: opp.leadId,
      createdAt: opp.createdAt.toISOString(),
      updatedAt: opp.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      opportunities: transformed,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, 'BadRequest', 'Invalid query parameters', error.errors);
    }
    console.error('Error fetching opportunities:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch opportunities');
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string) {
  try {
    // Check idempotency key
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (idempotencyKey) {
      // TODO: Check if this request was already processed
      // For now, skip idempotency check
    }

    // Validate request body
    const data = createOpportunitySchema.parse(req.body);

    // Verify customer exists and belongs to org
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        orgId,
      },
    });

    if (!customer) {
      return errorResponse(res, 404, 'NotFound', 'Customer not found');
    }

    // Create opportunity
    const opportunity = await prisma.opportunity.create({
      data: {
        orgId,
        customerId: data.customerId,
        title: data.title,
        estValue: data.estValue,
        probability: data.probability,
        closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
        stage: data.stage,
        ownerId: data.ownerId,
        leadId: data.leadId,
        valueType: 'RELATIONSHIP', // Default
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
      action: 'create',
      entityType: 'opportunity',
      entityId: opportunity.id,
      delta: {
        title: data.title,
        customerId: data.customerId,
        estValue: data.estValue,
        stage: data.stage,
      },
    });

    // Transform response
    const response = {
      id: opportunity.id,
      title: opportunity.title,
      customerId: opportunity.customerId,
      customerName: opportunity.customer.company || opportunity.customer.primaryName,
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

    return res.status(201).json(response);
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
      return errorResponse(res, 422, 'UnprocessableEntity', 'Validation failed', fieldErrors);
    }
    console.error('Error creating opportunity:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to create opportunity');
  }
}


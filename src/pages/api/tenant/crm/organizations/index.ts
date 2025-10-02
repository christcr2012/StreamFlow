import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  annualRevenue: z.number().min(0).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  ownerId: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('20'),
  query: z.string().optional(),
  industry: z.string().optional(),
});

// Error envelope helper
function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';

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
    const where: any = { orgId, archived: false };

    if (query.query) {
      where.OR = [
        { name: { contains: query.query, mode: 'insensitive' } },
        { domain: { contains: query.query, mode: 'insensitive' } },
        { email: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    if (query.industry) {
      where.industry = query.industry;
    }

    // Get total count
    const total = await prisma.customer.count({ where });

    // Get paginated results
    const organizations = await prisma.customer.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        industry: true,
        size: true,
        annualRevenue: true,
        website: true,
        phone: true,
        email: true,
        customerId: true,
        archived: true,
        createdAt: true,
      },
    });

    const transformed = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      domain: org.domain,
      industry: org.industry,
      size: org.size,
      annualRevenue: org.annualRevenue ? Number(org.annualRevenue) : undefined,
      website: org.website,
      phone: org.phone,
      email: org.email,
      customerId: org.customerId,
      archived: org.archived,
      createdAt: org.createdAt.toISOString(),
    }));

    return res.status(200).json({
      organizations: transformed,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, 'BadRequest', 'Invalid query parameters', error.errors);
    }
    console.error('Error fetching organizations:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch organizations');
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string) {
  try {
    // Check idempotency key
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (idempotencyKey) {
      // TODO: Check if this request was already processed
    }

    // Validate request body
    const data = createOrganizationSchema.parse(req.body);

    // Create organization
    const organization = await prisma.customer.create({
      data: {
        orgId,
        name: data.name,
        domain: data.domain || undefined,
        industry: data.industry || undefined,
        size: data.size || undefined,
        annualRevenue: data.annualRevenue || undefined,
        website: data.website || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        ownerId: data.ownerId || undefined,
        archived: false,
      },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'create',
      entityType: 'organization',
      entityId: organization.id,
      delta: {
        name: data.name,
        industry: data.industry,
        size: data.size,
      },
    });

    // Transform response
    const response = {
      id: organization.id,
      name: organization.name,
      domain: organization.domain,
      industry: organization.industry,
      size: organization.size,
      annualRevenue: organization.annualRevenue ? Number(organization.annualRevenue) : undefined,
      website: organization.website,
      phone: organization.phone,
      email: organization.email,
      customerId: organization.customerId,
      ownerId: organization.ownerId,
      archived: organization.archived,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
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
    console.error('Error creating organization:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to create organization');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import {
  createOrganization,
  listOrganizations,
  CreateOrganizationSchema,
} from '@/server/services/crm/organizationService';

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  industry: z.string().optional(),
  archived: z.string().transform((v) => v === 'true').optional(),
  ownerId: z.string().optional(),
});

// Error envelope helper
function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    ok: false,
    error: { code: error, message, details },
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

    // List organizations
    const result = await listOrganizations({
      orgId,
      archived: query.archived,
      ownerId: query.ownerId,
      search: query.search,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });

    const transformed = result.organizations.map((org) => ({
      id: org.id,
      name: org.name,
      domain: org.domain,
      industry: org.industry,
      size: org.size,
      annualRevenue: org.annualRevenue,
      website: org.website,
      phone: org.phone,
      ownerId: org.ownerId,
      archived: org.archived,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
      contactCount: org._count.contacts,
      opportunityCount: org._count.opportunities,
    }));

    return res.status(200).json({
      ok: true,
      data: {
        organizations: transformed,
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
      },
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
    const data = CreateOrganizationSchema.parse(req.body);

    // Create organization
    const organization = await createOrganization({
      orgId,
      userId,
      data,
    });

    // Transform response
    const response = {
      ok: true,
      data: {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        industry: organization.industry,
        size: organization.size,
        annualRevenue: organization.annualRevenue,
        website: organization.website,
        phone: organization.phone,
        ownerId: organization.ownerId,
        archived: organization.archived,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      },
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


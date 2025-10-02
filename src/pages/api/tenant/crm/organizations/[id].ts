import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import {
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  UpdateOrganizationSchema,
} from '@/server/services/crm/organizationService';

// Error envelope helper
function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any): void {
  res.status(status).json({
    ok: false,
    error: { code: error, message, details },
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';
  const { id } = req.query;

  if (typeof id !== 'string') {
    errorResponse(res, 400, 'BadRequest', 'Invalid organization ID');
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
    const organization = await getOrganizationById({
      orgId,
      organizationId: id,
    });

    if (!organization) {
      errorResponse(res, 404, 'NotFound', 'Organization not found');
      return;
    }

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
        contacts: organization.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          title: c.title,
          isPrimary: c.isPrimary,
        })),
        opportunities: organization.opportunities.map((o) => ({
          id: o.id,
          title: o.title,
          estValue: o.estValue ? Number(o.estValue) : undefined,
          stage: o.stage,
        })),
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching organization:', error);
    errorResponse(res, 500, 'Internal', 'Failed to fetch organization');
    return;
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string): Promise<void> {
  try {
    // Validate request body
    const data = UpdateOrganizationSchema.parse(req.body);

    // Update organization
    const organization = await updateOrganization({
      orgId,
      userId,
      organizationId: id,
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
    console.error('Error updating organization:', error);
    errorResponse(res, 500, 'Internal', 'Failed to update organization');
    return;
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string): Promise<void> {
  try {
    // Soft delete (archive) by default
    await deleteOrganization({
      orgId,
      userId,
      organizationId: id,
      hard: false,
    });

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting organization:', error);
    errorResponse(res, 500, 'Internal', 'Failed to delete organization');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


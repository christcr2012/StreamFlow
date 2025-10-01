import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';

// Validation schema for updates
const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  annualRevenue: z.number().min(0).optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  ownerId: z.string().optional(),
  archived: z.boolean().optional(),
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
  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';
  const { id } = req.query;

  if (typeof id !== 'string') {
    return errorResponse(res, 400, 'BadRequest', 'Invalid organization ID');
  }

  if (req.method === 'GET') {
    return handleGet(req, res, orgId, id);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, orgId, userId, id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, orgId, userId, id);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string, id: string) {
  try {
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!organization) {
      return errorResponse(res, 404, 'NotFound', 'Organization not found');
    }

    // Get related contacts
    const contacts = await prisma.contact.findMany({
      where: {
        orgId,
        organizationId: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        isPrimary: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    });

    // Get related jobs (Bridge System)
    const jobs = await prisma.jobTicket.findMany({
      where: {
        orgId,
        organizationId: id,
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

    // Get related opportunities
    // Note: Opportunities link to Customer, not Organization directly
    // We'll need to find opportunities through contacts or customer
    const opportunities = await prisma.opportunity.findMany({
      where: {
        orgId,
        // TODO: Link through customer when bridge is complete
      },
      select: {
        id: true,
        title: true,
        estValue: true,
        stage: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
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
      ownerName: undefined, // TODO: Fetch from User
      notes: organization.notes,
      archived: organization.archived,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        title: c.title,
        isPrimary: c.isPrimary,
      })),
      jobs: jobs.map((j) => ({
        id: j.id,
        serviceType: j.serviceType,
        status: j.status,
        scheduledAt: j.scheduledAt?.toISOString(),
      })),
      opportunities: opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        estValue: o.estValue ? Number(o.estValue) : undefined,
        stage: o.stage,
      })),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch organization');
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string) {
  try {
    // Validate request body
    const data = updateOrganizationSchema.parse(req.body);

    // Check if organization exists
    const existing = await prisma.organization.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!existing) {
      return errorResponse(res, 404, 'NotFound', 'Organization not found');
    }

    // Update organization
    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.domain !== undefined && { domain: data.domain || null }),
        ...(data.industry !== undefined && { industry: data.industry || null }),
        ...(data.size !== undefined && { size: data.size || null }),
        ...(data.annualRevenue !== undefined && { annualRevenue: data.annualRevenue || null }),
        ...(data.website !== undefined && { website: data.website || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId || null }),
        ...(data.archived !== undefined && { archived: data.archived }),
      },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'update',
      entityType: 'organization',
      entityId: id,
      delta: data,
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
      return errorResponse(res, 422, 'UnprocessableEntity', 'Validation failed', fieldErrors);
    }
    console.error('Error updating organization:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to update organization');
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string) {
  try {
    // Check if organization exists
    const existing = await prisma.organization.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!existing) {
      return errorResponse(res, 404, 'NotFound', 'Organization not found');
    }

    // Soft delete (archive) instead of hard delete
    await prisma.organization.update({
      where: { id },
      data: { archived: true },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'delete',
      entityType: 'organization',
      entityId: id,
      delta: { archived: true },
    });

    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting organization:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to delete organization');
  }
}


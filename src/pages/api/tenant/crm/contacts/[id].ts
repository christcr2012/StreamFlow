import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Validation schema for updates
const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  workPhone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  organizationId: z.string().optional(),
  isPrimary: z.boolean().optional(),
  linkedIn: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  ownerId: z.string().optional(),
  source: z.string().optional(),
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
    errorResponse(res, 400, 'BadRequest', 'Invalid contact ID');
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
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!contact) {
      errorResponse(res, 404, 'NotFound', 'Contact not found');
      return;
    }

    // Get related jobs (Bridge System)
    const jobs = await prisma.jobTicket.findMany({
      where: {
        orgId,
        contactId: id,
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

    // TODO: Fetch organization name when Organization model is ready

    // Transform response
    const response = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      mobilePhone: contact.mobilePhone,
      workPhone: contact.workPhone,
      title: contact.title,
      department: contact.department,
      organizationId: contact.organizationId,
      organizationName: undefined, // TODO: Fetch from Organization
      isPrimary: contact.isPrimary,
      linkedIn: contact.linkedIn,
      twitter: contact.twitter,
      ownerId: contact.ownerId,
      ownerName: undefined, // TODO: Fetch from User
      source: contact.source,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      jobs: jobs.map((job) => ({
        id: job.id,
        serviceType: job.serviceType,
        status: job.status,
        scheduledAt: job.scheduledAt?.toISOString(),
      })),
      notes: [], // TODO: Add when Activity model is implemented
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching contact:', error);
    errorResponse(res, 500, 'Internal', 'Failed to fetch contact');
    return;
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string): Promise<void> {
  try {
    // Validate request body
    const data = updateContactSchema.parse(req.body);

    // Check if contact exists
    const existing = await prisma.contact.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!existing) {
      errorResponse(res, 404, 'NotFound', 'Contact not found');
      return;
    }

    // If organizationId is being updated, verify it exists
    if (data.organizationId) {
      const organization = await prisma.organization.findFirst({
        where: { id: data.organizationId, orgId },
      });
      if (!organization) {
        errorResponse(res, 404, 'NotFound', 'Organization not found');
        return;
      }
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.mobilePhone !== undefined && { mobilePhone: data.mobilePhone || null }),
        ...(data.workPhone !== undefined && { workPhone: data.workPhone || null }),
        ...(data.title !== undefined && { title: data.title || null }),
        ...(data.department !== undefined && { department: data.department || null }),
        ...(data.organizationId && { organizationId: data.organizationId }), // Only update if provided (required field)
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
        ...(data.linkedIn !== undefined && { linkedIn: data.linkedIn || null }),
        ...(data.twitter !== undefined && { twitter: data.twitter || null }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId || null }),
        ...(data.source !== undefined && { source: data.source || null }),
      },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'update',
      entityType: 'contact',
      entityId: id,
      delta: data,
    });

    // Transform response
    const response = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      mobilePhone: contact.mobilePhone,
      workPhone: contact.workPhone,
      title: contact.title,
      department: contact.department,
      organizationId: contact.organizationId,
      organizationName: undefined, // TODO: Fetch from Organization
      isPrimary: contact.isPrimary,
      linkedIn: contact.linkedIn,
      twitter: contact.twitter,
      ownerId: contact.ownerId,
      source: contact.source,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
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
    console.error('Error updating contact:', error);
    errorResponse(res, 500, 'Internal', 'Failed to update contact');
    return;
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string): Promise<void> {
  try {
    // Check if contact exists
    const existing = await prisma.contact.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!existing) {
      errorResponse(res, 404, 'NotFound', 'Contact not found');
      return;
    }

    // Delete contact
    await prisma.contact.delete({
      where: { id },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'delete',
      entityType: 'contact',
      entityId: id,
      delta: {},
    });

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting contact:', error);
    errorResponse(res, 500, 'Internal', 'Failed to delete contact');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


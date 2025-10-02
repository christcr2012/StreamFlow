import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Validation schemas
const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  workPhone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  organizationId: z.string().optional(), // Optional - will auto-create "Unassigned" if not provided
  isPrimary: z.boolean().default(false),
  linkedIn: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  ownerId: z.string().optional(),
  source: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('20'),
  query: z.string().optional(),
  organization: z.string().optional(),
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
    const where: any = { orgId };

    if (query.query) {
      where.OR = [
        { name: { contains: query.query, mode: 'insensitive' } },
        { email: { contains: query.query, mode: 'insensitive' } },
        { phone: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    if (query.organization) {
      where.organizationId = query.organization;
    }

    // Get total count
    const total = await prisma.contact.count({ where });

    // Get paginated results
    const contacts = await prisma.contact.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        title: true,
        organizationId: true,
        isPrimary: true,
        createdAt: true,
      },
    });

    // TODO: Fetch organization names when Organization model is ready
    // For now, return without organization names

    const transformed = contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      title: contact.title,
      organizationId: contact.organizationId,
      organizationName: undefined, // TODO: Fetch from Organization
      isPrimary: contact.isPrimary,
      createdAt: contact.createdAt.toISOString(),
    }));

    return res.status(200).json({
      contacts: transformed,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, 'BadRequest', 'Invalid query parameters', error.errors);
    }
    console.error('Error fetching contacts:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch contacts');
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
    const data = createContactSchema.parse(req.body);

    // Get or create organization
    let organizationId = data.organizationId;

    if (organizationId) {
      // Verify organization exists
      const organization = await prisma.organization.findFirst({
        where: { id: organizationId, orgId },
      });

      if (!organization) {
        return errorResponse(res, 404, 'NotFound', 'Organization not found');
      }
    } else {
      // Auto-create "Unassigned" organization for this tenant
      const unassignedOrg = await prisma.organization.upsert({
        where: {
          orgId_name: {
            orgId,
            name: 'Unassigned',
          },
        },
        update: {},
        create: {
          orgId,
          name: 'Unassigned',
          archived: false,
        },
      });
      organizationId = unassignedOrg.id;
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        orgId,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        mobilePhone: data.mobilePhone || undefined,
        workPhone: data.workPhone || undefined,
        title: data.title || undefined,
        department: data.department || undefined,
        organizationId,
        isPrimary: data.isPrimary,
        linkedIn: data.linkedIn || undefined,
        twitter: data.twitter || undefined,
        ownerId: data.ownerId || undefined,
        source: data.source || undefined,
      },
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'create',
      entityType: 'contact',
      entityId: contact.id,
      delta: {
        name: data.name,
        email: data.email,
        organizationId: data.organizationId,
      },
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
    console.error('Error creating contact:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to create contact');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


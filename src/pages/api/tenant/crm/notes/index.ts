import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Zod schemas for validation
const CreateNoteSchema = z.object({
  idempotencyKey: z.string().uuid(),
  entityType: z.enum(['opportunity', 'organization', 'contact']),
  entityId: z.string(),
  body: z.string().min(1).max(10000),
});

const ListNotesSchema = z.object({
  entityType: z.enum(['opportunity', 'organization', 'contact']).optional(),
  entityId: z.string().optional(),
  createdBy: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  try {
    const validation = ListNotesSchema.safeParse(req.query);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid query parameters', validation.error.errors);
    }

    const { entityType, entityId, createdBy, limit, offset } = validation.data;

    const where: any = { orgId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (createdBy) where.createdBy = createdBy;

    const [notes, total] = await Promise.all([
      prisma.crmNote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.crmNote.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: {
        notes,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Error listing notes:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to list notes');
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string) {
  try {
    const validation = CreateNoteSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    const { idempotencyKey, entityType, entityId, body } = validation.data;

    // Check idempotency
    const existing = await prisma.crmNote.findFirst({
      where: {
        orgId,
        entityType,
        entityId,
        createdBy: userId,
        body,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last 60 seconds
        },
      },
    });

    if (existing) {
      return res.status(200).json({
        ok: true,
        data: existing,
      });
    }

    // Verify entity exists
    let entityExists = false;
    if (entityType === 'opportunity') {
      entityExists = !!(await prisma.opportunity.findFirst({ where: { orgId, id: entityId } }));
    } else if (entityType === 'organization') {
      entityExists = !!(await prisma.customer.findFirst({ where: { orgId, id: entityId } }));
    } else if (entityType === 'contact') {
      entityExists = !!(await prisma.contact.findFirst({ where: { orgId, id: entityId } }));
    }

    if (!entityExists) {
      return errorResponse(res, 404, 'NotFound', `${entityType} not found`);
    }

    // Create note
    const note = await prisma.crmNote.create({
      data: {
        orgId,
        entityType,
        entityId,
        body,
        createdBy: userId,
      },
    });

    // Audit log (redact PII from body)
    await auditLog({
      orgId,
      actorId: userId,
      action: 'create',
      entityType: 'crm_note',
      entityId: note.id,
      delta: { entityType, entityId, bodyLength: body.length },
    });

    return res.status(201).json({
      ok: true,
      data: note,
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to create note');
  }
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

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


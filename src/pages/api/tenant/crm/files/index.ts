import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

// Zod schemas for validation
const ListFilesSchema = z.object({
  entityType: z.enum(['opportunity', 'organization', 'contact']).optional(),
  entityId: z.string().optional(),
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
    const validation = ListFilesSchema.safeParse(req.query);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid query parameters', validation.error.errors);
    }

    const { entityType, entityId, limit, offset } = validation.data;

    const where: any = { orgId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [files, total] = await Promise.all([
      prisma.crmFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.crmFile.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: {
        files,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to list files');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orgId } = getUserInfo(req);

  if (req.method === 'GET') {
    return handleGet(req, res, orgId);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


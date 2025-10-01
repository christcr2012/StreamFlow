// src/pages/api/audit/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { auditService, ServiceError } from '@/server/services/auditService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only GET allowed
  if (req.method !== 'GET') {
    res.status(405).json({
      error: 'MethodNotAllowed',
      message: 'Method not allowed',
    });
    return;
  }

  // Get authenticated user
  const email = getEmailFromReq(req);
  if (!email) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
    return;
  }

  // Get user and orgId
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, orgId: true },
  });

  if (!user || !user.orgId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid user session',
    });
    return;
  }

  const { orgId } = user;

  try {
    const {
      page,
      limit,
      entityType,
      entityId,
      actorId,
      action,
      fromDate,
      toDate,
      sortOrder,
    } = req.query;

    const result = await auditService.list(orgId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
      entityType: entityType as string | undefined,
      entityId: entityId as string | undefined,
      actorId: actorId as string | undefined,
      action: action as string | undefined,
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      sortOrder: (sortOrder as any) || 'desc',
    });

    res.status(200).json(result);
    return;

  } catch (error) {
    console.error('Audit API error:', error);

    // Handle service errors
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errors = error.flatten().fieldErrors;
      res.status(422).json({
        error: 'ValidationError',
        message: 'Invalid audit query parameters',
        details: errors,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal',
      message: 'An error occurred while processing your request',
    });
  }
}

// Export with rate limiting (API preset: 60 requests per minute)
export default withRateLimit(rateLimitPresets.api, handler);


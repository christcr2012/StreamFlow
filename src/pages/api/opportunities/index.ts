// src/pages/api/opportunities/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { opportunityService, ServiceError } from '@/server/services/opportunityService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withIdempotency } from '@/middleware/idempotency';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  const { orgId, id: userId } = user;

  try {
    // GET - List opportunities
    if (req.method === 'GET') {
      const { page, limit, customerId, stage, ownerId, sortBy, sortOrder } = req.query;

      const result = await opportunityService.list(orgId, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        customerId: customerId as string | undefined,
        stage: stage as string | undefined,
        ownerId: ownerId as string | undefined,
        sortBy: (sortBy as any) || 'createdAt',
        sortOrder: (sortOrder as any) || 'desc',
      });

      res.status(200).json(result);
      return;
    }

    // POST - Create opportunity
    if (req.method === 'POST') {
      const result = await opportunityService.create(orgId, userId, req.body);

      res.status(201).json(result);
      return;
    }

    // Method not allowed
    res.status(405).json({
      error: 'MethodNotAllowed',
      message: 'Method not allowed',
    });
    return;

  } catch (error) {
    console.error('Opportunities API error:', error);

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
        message: 'Invalid opportunity data',
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

// Export with rate limiting and idempotency (for POST only)
export default withRateLimit(
  rateLimitPresets.api,
  withIdempotency({}, handler)
);


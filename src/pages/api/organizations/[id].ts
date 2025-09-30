// src/pages/api/organizations/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { organizationService, ServiceError } from '@/server/services/organizationService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withIdempotency } from '@/middleware/idempotency';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  retryAfter?: number;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get authenticated user
  const email = getEmailFromReq(req);
  if (!email) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
  }

  // Get user and orgId
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, orgId: true },
  });

  if (!user || !user.orgId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid user session',
    });
  }

  const { orgId, id: userId } = user;
  const { id: organizationId } = req.query;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Organization ID is required',
    });
  }

  try {
    // GET - Get organization by ID
    if (req.method === 'GET') {
      const result = await organizationService.getById(orgId, organizationId);
      res.status(200).json(result);
      return;
    }

    // PUT - Update organization
    if (req.method === 'PUT') {
      const result = await organizationService.update(orgId, userId, organizationId, req.body);
      res.status(200).json(result);
      return;
    }

    // DELETE - Delete organization
    if (req.method === 'DELETE') {
      await organizationService.delete(orgId, userId, organizationId);
      res.status(204).end();
      return;
    }

    // Method not allowed
    res.status(405).json({
      error: 'MethodNotAllowed',
      message: 'Method not allowed',
    });
    return;

  } catch (error) {
    console.error('Organization API error:', error);

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
        message: 'Invalid organization data',
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

// Export with rate limiting and idempotency (for PUT/DELETE)
export default withRateLimit(
  rateLimitPresets.api,
  withIdempotency({}, handler)
);


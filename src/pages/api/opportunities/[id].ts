// src/pages/api/opportunities/[id].ts
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
  const { id: opportunityId } = req.query;

  if (!opportunityId || typeof opportunityId !== 'string') {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Opportunity ID is required',
    });
    return;
  }

  try {
    // GET - Get opportunity by ID
    if (req.method === 'GET') {
      const result = await opportunityService.getById(orgId, opportunityId);
      res.status(200).json(result);
      return;
    }

    // PUT - Update opportunity
    if (req.method === 'PUT') {
      const result = await opportunityService.update(orgId, userId, opportunityId, req.body);
      res.status(200).json(result);
      return;
    }

    // DELETE - Delete opportunity
    if (req.method === 'DELETE') {
      await opportunityService.delete(orgId, userId, opportunityId);
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
    console.error('Opportunity API error:', error);

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

// Export with rate limiting and idempotency (for PUT/DELETE)
export default withRateLimit(
  rateLimitPresets.api,
  withIdempotency({}, handler)
);


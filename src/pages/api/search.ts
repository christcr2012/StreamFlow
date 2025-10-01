// src/pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { searchService, ServiceError } from '@/server/services/searchService';
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
    const { q, query, entities, limit } = req.query;

    // Support both 'q' and 'query' parameters
    const searchQuery = (q || query) as string;

    if (!searchQuery) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Search query is required (use ?q=... or ?query=...)',
      });
      return;
    }

    // Parse entities if provided
    let entityList: any = undefined;
    if (entities) {
      if (typeof entities === 'string') {
        entityList = entities.split(',');
      } else if (Array.isArray(entities)) {
        entityList = entities;
      }
    }

    // Perform search
    const result = await searchService.search(orgId, {
      query: searchQuery,
      entities: entityList,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.status(200).json(result);
    return;

  } catch (error) {
    console.error('Search API error:', error);

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
        message: 'Invalid search parameters',
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


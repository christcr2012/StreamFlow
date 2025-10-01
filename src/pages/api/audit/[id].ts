// src/pages/api/audit/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { auditService, ServiceError } from '@/server/services/auditService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

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
  const { id: logId } = req.query;

  if (!logId || typeof logId !== 'string') {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Audit log ID is required',
    });
    return;
  }

  try {
    const log = await auditService.getById(orgId, logId);
    res.status(200).json(log);
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

    res.status(500).json({
      error: 'Internal',
      message: 'An error occurred while processing your request',
    });
  }
}

// Export with rate limiting (API preset: 60 requests per minute)
export default withRateLimit(rateLimitPresets.api, handler);


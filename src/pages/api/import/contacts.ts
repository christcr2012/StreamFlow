// src/pages/api/import/contacts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { importService, ServiceError } from '@/server/services/importService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only POST allowed
  if (req.method !== 'POST') {
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

  const { orgId, id: userId } = user;

  try {
    const { csvContent, validate } = req.body;

    if (!csvContent || typeof csvContent !== 'string') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'CSV content is required',
      });
      return;
    }

    // If validate flag is set, only validate without importing
    if (validate) {
      const validation = await importService.validateCSV(csvContent);
      res.status(200).json(validation);
      return;
    }

    // Import contacts
    const result = await importService.importContacts(orgId, userId, csvContent);

    // Return appropriate status code
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    if (result.errorCount > 0) {
      res.status(207).json(result); // 207 Multi-Status (partial success)
      return;
    }

    res.status(200).json(result);
    return;

  } catch (error) {
    console.error('Import API error:', error);

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

// Export with rate limiting (import preset: 10 requests per hour)
export default withRateLimit(rateLimitPresets.import, handler);


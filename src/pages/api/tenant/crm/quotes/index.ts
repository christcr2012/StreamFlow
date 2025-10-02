import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import { auditLog } from '@/server/services/auditService';
import * as quoteService from '@/server/services/bridge/quoteService';

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
    const { opportunityId, customerId, status, limit, offset } = req.query;

    const limitNum = limit ? parseInt(limit as string) : 20;
    const offsetNum = offset ? parseInt(offset as string) : 0;

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return errorResponse(res, 400, 'BadRequest', 'Invalid limit (must be 1-100)');
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return errorResponse(res, 400, 'BadRequest', 'Invalid offset');
    }

    // Get quotes
    const result = await quoteService.listQuotes({
      orgId,
      opportunityId: opportunityId as string,
      customerId: customerId as string,
      status: status as string,
      limit: limitNum,
      offset: offsetNum,
    });

    return res.status(200).json({
      ok: true,
      data: {
        quotes: result.quotes,
        pagination: {
          total: result.total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < result.total,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch quotes');
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string) {
  try {
    // Validate request body
    const validation = quoteService.CreateQuoteSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    // Create quote
    const quote = await quoteService.createQuote({
      orgId,
      userId,
      data: validation.data,
    });

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'create',
      entityType: 'quote',
      entityId: quote.id,
      delta: { title: quote.title, customerId: quote.customerId, opportunityId: quote.opportunityId },
    });

    return res.status(201).json({
      ok: true,
      data: quote,
    });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    if (error.message === 'Customer not found' || error.message === 'Opportunity not found') {
      return errorResponse(res, 404, 'NotFound', error.message);
    }
    return errorResponse(res, 500, 'Internal', 'Failed to create quote');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


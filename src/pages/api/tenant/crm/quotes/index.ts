import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { quoteService, CreateQuoteSchema } from '@/server/services/bridge/quoteService';

// Error envelope helper
function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Add withAudience middleware (Task 3)
  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';

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
    const { opportunityId, customerId, status, page, limit } = req.query;

    // Validate query parameters
    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;

    if (isNaN(pageNum) || pageNum < 1) {
      return errorResponse(res, 400, 'BadRequest', 'Invalid page number');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return errorResponse(res, 400, 'BadRequest', 'Invalid limit (must be 1-100)');
    }

    // Get quotes
    const result = await quoteService.list(orgId, {
      opportunityId: opportunityId as string,
      customerId: customerId as string,
      status: status as string,
      page: pageNum,
      limit: limitNum,
    });

    // Transform response
    const response = {
      quotes: result.quotes.map((q) => ({
        id: q.id,
        opportunityId: q.opportunityId,
        customerId: q.customerId,
        customerName: q.customer.company || q.customer.primaryName,
        opportunityTitle: q.opportunity?.title,
        title: q.title,
        description: q.description,
        subtotal: Number(q.subtotal),
        tax: Number(q.tax),
        total: Number(q.total),
        status: q.status,
        validUntil: q.validUntil?.toISOString(),
        acceptedAt: q.acceptedAt?.toISOString(),
        rejectedAt: q.rejectedAt?.toISOString(),
        createdAt: q.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch quotes');
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string) {
  try {
    // Validate request body
    const data = CreateQuoteSchema.parse(req.body);

    // Create quote
    const quote = await quoteService.create(orgId, userId, data);

    // Transform response
    const response = {
      id: quote.id,
      opportunityId: quote.opportunityId,
      customerId: quote.customerId,
      title: quote.title,
      description: quote.description,
      items: quote.items,
      subtotal: Number(quote.subtotal),
      tax: Number(quote.tax),
      total: Number(quote.total),
      status: quote.status,
      validUntil: quote.validUntil?.toISOString(),
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
    };

    return res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const field = err.path[0]?.toString() || 'unknown';
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      return errorResponse(res, 422, 'UnprocessableEntity', 'Validation failed', fieldErrors);
    }

    if (error instanceof Error) {
      if (error.message === 'Customer not found') {
        return errorResponse(res, 404, 'NotFound', 'Customer not found');
      }
      if (error.message === 'Opportunity not found') {
        return errorResponse(res, 404, 'NotFound', 'Opportunity not found');
      }
      return errorResponse(res, 500, 'Internal', error.message);
    }

    console.error('Error creating quote:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to create quote');
  }
}


import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import { auditLog } from '@/server/services/auditService';
import * as quoteService from '@/server/services/bridge/quoteService';
import { UpdateQuoteSchema } from '@/server/services/bridge/quoteService';

// Error envelope helper
function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any): void {
  res.status(status).json({
    error,
    message,
    details,
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';
  const { id } = req.query;

  if (typeof id !== 'string') {
    errorResponse(res, 400, 'BadRequest', 'Invalid quote ID');
    return;
  }

  if (req.method === 'GET') {
    return handleGet(req, res, orgId, id);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, orgId, userId, id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, orgId, userId, id);
  } else {
    errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
    return;
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string, id: string): Promise<void> {
  try {
    const quote = await quoteService.getQuoteById({ orgId, quoteId: id });

    if (!quote) {
      errorResponse(res, 404, 'NotFound', 'Quote not found');
      return;
    }

    // Transform response
    const response = {
      id: quote.id,
      opportunityId: quote.opportunityId,
      customerId: quote.customerId,
      customerName: quote.customer.company || quote.customer.primaryName,
      opportunityTitle: quote.opportunity?.title,
      opportunityStage: quote.opportunity?.stage,
      title: quote.title,
      description: quote.description,
      items: quote.items,
      subtotal: Number(quote.subtotal),
      tax: Number(quote.tax),
      total: Number(quote.total),
      status: quote.status,
      validUntil: quote.validUntil?.toISOString(),
      acceptedAt: quote.acceptedAt?.toISOString(),
      rejectedAt: quote.rejectedAt?.toISOString(),
      createdBy: quote.createdBy,
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
    };

    return res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Quote not found') {
      errorResponse(res, 404, 'NotFound', 'Quote not found');
      return;
    }

    console.error('Error fetching quote:', error);
    errorResponse(res, 500, 'Internal', 'Failed to fetch quote');
    return;
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string): Promise<void> {
  try {
    // Validate request body
    const data = UpdateQuoteSchema.parse(req.body);

    // Update quote
    const quote = await quoteService.updateQuote({ orgId, userId, quoteId: id, data });

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
      acceptedAt: quote.acceptedAt?.toISOString(),
      rejectedAt: quote.rejectedAt?.toISOString(),
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
    };

    return res.status(200).json(response);
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
      errorResponse(res, 422, 'UnprocessableEntity', 'Validation failed', fieldErrors);
      return;
    }

    if (error instanceof Error && error.message === 'Quote not found') {
      errorResponse(res, 404, 'NotFound', 'Quote not found');
      return;
    }

    console.error('Error updating quote:', error);
    errorResponse(res, 500, 'Internal', 'Failed to update quote');
    return;
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string): Promise<void> {
  try {
    await quoteService.deleteQuote({ orgId, quoteId: id });

    res.status(204).end();
  } catch (error) {
    if (error instanceof Error && error.message === 'Quote not found') {
      errorResponse(res, 404, 'NotFound', 'Quote not found');
      return;
    }

    console.error('Error deleting quote:', error);
    errorResponse(res, 500, 'Internal', 'Failed to delete quote');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


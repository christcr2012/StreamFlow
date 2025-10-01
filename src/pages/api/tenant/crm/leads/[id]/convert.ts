import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { conversionService, ConvertLeadSchema } from '@/server/services/bridge/conversionService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

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
  const { id } = req.query;

  if (typeof id !== 'string') {
    return errorResponse(res, 400, 'BadRequest', 'Invalid lead ID');
  }

  if (req.method === 'POST') {
    return handlePost(req, res, orgId, userId, id);
  } else if (req.method === 'GET') {
    return handleGet(req, res, orgId, id);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orgId: string | null, userId: string, leadId: string) {
  if (!orgId) {
    return errorResponse(res, 400, 'BadRequest', 'Organization ID required');
  }
  try {
    // Validate request body
    const bodySchema = ConvertLeadSchema.omit({ leadId: true });
    const data = bodySchema.parse(req.body);

    // Convert lead
    const result = await conversionService.convertLead(orgId, userId, {
      leadId,
      ...data,
    });

    // Return result
    const response = {
      success: true,
      customerId: result.customerId,
      organizationId: result.organizationId,
      contactId: result.contactId,
      auditId: result.auditId,
      alreadyConverted: result.alreadyConverted,
      message: result.alreadyConverted
        ? 'Lead was already converted'
        : 'Lead successfully converted to customer',
    };

    return res.status(result.alreadyConverted ? 200 : 201).json(response);
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
      if (error.message === 'Lead not found') {
        return errorResponse(res, 404, 'NotFound', 'Lead not found');
      }
      return errorResponse(res, 500, 'Internal', error.message);
    }

    console.error('Error converting lead:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to convert lead');
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string | null, leadId: string) {
  if (!orgId) {
    return errorResponse(res, 400, 'BadRequest', 'Organization ID required');
  }
  try {
    // Get conversion history
    const history = await conversionService.getLeadConversionHistory(orgId, leadId);

    return res.status(200).json(history);
  } catch (error) {
    if (error instanceof Error && error.message === 'Lead not found') {
      return errorResponse(res, 404, 'NotFound', 'Lead not found');
    }

    console.error('Error fetching conversion history:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch conversion history');
  }
}

// Export with withAudience middleware
export default withAudience(AUDIENCE.CLIENT_ONLY, handler);


// src/pages/api/contacts/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { contactService, ServiceError } from '@/server/services/contactService';
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
  const { id: contactId } = req.query;

  if (!contactId || typeof contactId !== 'string') {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Contact ID is required',
    });
    return;
  }

  try {
    // GET - Get contact by ID
    if (req.method === 'GET') {
      const result = await contactService.getById(orgId, contactId);
      res.status(200).json(result);
      return;
    }

    // PUT - Update contact
    if (req.method === 'PUT') {
      const result = await contactService.update(orgId, userId, contactId, req.body);
      res.status(200).json(result);
      return;
    }

    // DELETE - Delete contact
    if (req.method === 'DELETE') {
      await contactService.delete(orgId, userId, contactId);
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
    console.error('Contact API error:', error);

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
        message: 'Invalid contact data',
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


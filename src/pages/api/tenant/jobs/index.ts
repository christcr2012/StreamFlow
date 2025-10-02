// src/pages/api/tenant/jobs/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { jobTicketService, ServiceError } from '@/server/services/jobTicketService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withIdempotency } from '@/middleware/idempotency';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const email = getEmailFromReq(req);
  if (!email) {
    res.status(401).json({ error: 'Unauthorized', message: 'Login required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, orgId: true },
  });

  if (!user || !user.orgId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
    return;
  }

  const { orgId, id: userId } = user;

  try {
    // GET - List job tickets
    if (req.method === 'GET') {
      const { status, crewId, customerId, limit } = req.query;
      
      const tickets = await jobTicketService.list(orgId, {
        status: status as string,
        crewId: crewId as string,
        customerId: customerId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.status(200).json(tickets);
      return;
    }

    // POST - Create job ticket
    if (req.method === 'POST') {
      const ticket = await jobTicketService.create(orgId, userId, req.body);
      res.status(201).json(ticket);
      return;
    }

    res.status(405).json({ error: 'MethodNotAllowed', message: 'Method not allowed' });
    return;
  } catch (error) {
    console.error('Job tickets API error:', error);

    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    if (error instanceof z.ZodError) {
      res.status(422).json({
        error: 'ValidationError',
        message: 'Invalid job ticket data',
        details: error.flatten().fieldErrors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withAudience(
  AUDIENCE.CLIENT_ONLY,
  withRateLimit(
    rateLimitPresets.api,
    withIdempotency({}, handler)
  )
);


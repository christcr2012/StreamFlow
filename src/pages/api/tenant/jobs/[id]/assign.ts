// src/pages/api/tenant/jobs/[id]/assign.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { jobTicketService, ServiceError } from '@/server/services/jobTicketService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'POST only' });
    return;
  }

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
  const { id: ticketId } = req.query;

  if (typeof ticketId !== 'string') {
    res.status(400).json({ error: 'BadRequest', message: 'Invalid ticket ID' });
    return;
  }

  try {
    const ticket = await jobTicketService.assign(orgId, userId, ticketId, req.body);
    res.status(200).json(ticket);
    return;
  } catch (error) {
    console.error('Job assign API error:', error);

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
        message: 'Invalid assign data',
        details: error.flatten().fieldErrors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, withRateLimit(rateLimitPresets.api, handler));


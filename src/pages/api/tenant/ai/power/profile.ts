// src/pages/api/tenant/ai/power/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { aiPowerService, ServiceError } from '@/server/services/aiPowerService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
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
    select: { id: true, orgId: true, role: true },
  });

  if (!user || !user.orgId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
    return;
  }

  const { orgId, id: userId } = user;

  try {
    // GET - Get power profile
    if (req.method === 'GET') {
      const profile = await aiPowerService.getProfile(orgId);
      res.status(200).json(profile);
      return;
    }

    // POST - Update power profile
    if (req.method === 'POST') {
      const profile = await aiPowerService.updateProfile(orgId, userId, req.body);
      res.status(200).json(profile);
      return;
    }

    res.status(405).json({ error: 'MethodNotAllowed', message: 'Method not allowed' });
    return;
  } catch (error) {
    console.error('Power profile API error:', error);

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
        message: 'Invalid power profile data',
        details: error.flatten().fieldErrors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withRateLimit(rateLimitPresets.api, handler);


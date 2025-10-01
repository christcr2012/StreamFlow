// src/pages/api/tenant/ai/vertical/[vertical]/[task].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verticalAiService, ServiceError } from '@/server/services/verticalAiService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

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
    select: { id: true, orgId: true, role: true },
  });

  if (!user || !user.orgId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
    return;
  }

  const { orgId, id: userId, role } = user;
  const { vertical, task } = req.query;

  if (typeof vertical !== 'string' || typeof task !== 'string') {
    res.status(400).json({ error: 'BadRequest', message: 'Invalid parameters' });
    return;
  }

  try {
    const result = await verticalAiService.executeVerticalTask(
      orgId,
      userId,
      role,
      vertical,
      task,
      req.body
    );
    
    res.status(200).json(result);
    return;
  } catch (error) {
    console.error('Vertical AI task API error:', error);

    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withRateLimit(rateLimitPresets.ai, handler);


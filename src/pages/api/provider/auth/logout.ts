// src/pages/api/provider/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { clearProviderSessionCookie, getProviderEmailFromReq } from '@/middleware/providerAuth';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { prisma } from '@/lib/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'POST only' });
    return;
  }

  const providerEmail = getProviderEmailFromReq(req);

  if (providerEmail) {
    // Audit log logout
    try {
      await prisma.auditLog.create({
        data: {
          orgId: 'PROVIDER',
          actorId: providerEmail,
          action: 'provider.logout',
          entityType: 'provider',
          entityId: providerEmail,
          delta: {},
        },
      });
    } catch (error) {
      console.error('Failed to log provider logout:', error);
    }
  }

  // Clear session cookie
  clearProviderSessionCookie(res);

  res.status(200).json({ success: true });
}

export default withRateLimit(rateLimitPresets.api, handler);


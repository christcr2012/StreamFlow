// src/pages/api/customer/dashboard.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { customerPortalService, ServiceError } from '@/server/services/customerPortalService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'GET only' });
    return;
  }

  // Get customer token from header
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Customer token required' });
    return;
  }

  try {
    const auth = await customerPortalService.verifyCustomerToken(token);
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
      return;
    }

    const dashboard = await customerPortalService.getDashboard(auth.customerId);
    res.status(200).json(dashboard);
  } catch (error) {
    console.error('Customer dashboard API error:', error);

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

export default withRateLimit(rateLimitPresets.api, handler);


// src/pages/api/customer/appointments/request.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { customerPortalService, ServiceError } from '@/server/services/customerPortalService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { z } from 'zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'POST only' });
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

    const appointment = await customerPortalService.requestAppointment({
      ...req.body,
      customerId: auth.customerId,
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Appointment request API error:', error);

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
        message: 'Invalid data',
        details: error.flatten().fieldErrors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withRateLimit(rateLimitPresets.api, handler);


// src/pages/api/provider/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyProviderAuth, setProviderSessionCookie } from '@/middleware/providerAuth';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { z } from 'zod';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totpCode: z.string().length(6).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'POST only' });
    return;
  }

  try {
    const validated = LoginSchema.parse(req.body);

    const authResult = await verifyProviderAuth(
      validated.email,
      validated.password,
      validated.totpCode
    );

    if (!authResult.authenticated) {
      res.status(401).json({
        error: 'Unauthorized',
        message: authResult.error || 'Invalid credentials',
      });
      return;
    }

    // Set session cookie
    setProviderSessionCookie(res, authResult.email!, authResult.mode!);

    // Return success with mode indicator
    res.status(200).json({
      success: true,
      email: authResult.email,
      mode: authResult.mode,
      warning: authResult.mode === 'recovery' 
        ? 'Recovery mode active - database unavailable, limited operations'
        : undefined,
    });
    return;
  } catch (error) {
    console.error('Provider login API error:', error);

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

export default withAudience(AUDIENCE.PUBLIC, withRateLimit(rateLimitPresets.auth, handler));


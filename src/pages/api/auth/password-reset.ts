// src/pages/api/auth/password-reset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authService, ServiceError } from '@/server/services/authService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { z } from 'zod';

// Email validation regex (RFC5322 simplified)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password reset request schema
const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address').regex(emailRegex, 'Invalid email format'),
});

interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
  retryAfter?: number;
}

interface SuccessResponse {
  message: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'MethodNotAllowed',
      message: 'Method not allowed',
    });
  }

  try {
    // Validate request body
    const validationResult = resetRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return res.status(422).json({
        error: 'ValidationError',
        message: 'Invalid email address',
        details: errors as Record<string, string[]>,
      });
    }

    const { email } = validationResult.data;

    // Call service layer
    const result = await authService.requestPasswordReset({ email });

    // SECURITY: Always return 202 regardless of whether user exists
    return res.status(202).json({
      message: result.message,
    });

  } catch (error) {
    console.error('Password reset error:', error);

    // Handle service errors
    if (error instanceof ServiceError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errors = error.flatten().fieldErrors;
      return res.status(422).json({
        error: 'ValidationError',
        message: 'Invalid email address',
        details: errors as Record<string, string[]>,
      });
    }

    return res.status(500).json({
      error: 'Internal',
      message: 'Password reset request failed. Please try again.',
    });
  }
}

// Export with rate limiting middleware
export default withRateLimit(rateLimitPresets.auth, handler);


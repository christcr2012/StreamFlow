// src/pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authService, ServiceError } from '@/server/services/authService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withIdempotency } from '@/middleware/idempotency';
import { z } from 'zod';

// Email validation regex (RFC5322 simplified)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Registration request schema (includes confirmPassword for API validation)
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').regex(emailRegex, 'Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  tenantInvite: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
  retryAfter?: number;
}

interface SuccessResponse {
  userId: string;
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
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return res.status(422).json({
        error: 'ValidationError',
        message: 'Invalid registration data',
        details: errors as Record<string, string[]>,
      });
    }

    const { name, email, password, tenantInvite } = validationResult.data;

    // Call service layer
    const result = await authService.register({
      name,
      email,
      password,
      tenantInvite,
    });

    // Return success response
    return res.status(201).json({
      userId: result.userId,
      message: 'Registration successful',
    });

  } catch (error) {
    console.error('Registration error:', error);

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
        message: 'Invalid registration data',
        details: errors as Record<string, string[]>,
      });
    }

    return res.status(500).json({
      error: 'Internal',
      message: 'Registration failed. Please try again.',
    });
  }
}

// Export with rate limiting and idempotency middleware
export default withRateLimit(
  rateLimitPresets.auth,
  withIdempotency({}, handler)
);


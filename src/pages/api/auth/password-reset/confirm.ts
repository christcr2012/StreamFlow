// src/pages/api/auth/password-reset/confirm.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authService, ServiceError } from '@/server/services/authService';
import { z } from 'zod';

// Password reset confirmation schema
const confirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

interface SuccessResponse {
  message: string;
}

export default async function handler(
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
    const validationResult = confirmSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return res.status(422).json({
        error: 'ValidationError',
        message: 'Invalid password reset data',
        details: errors as Record<string, string[]>,
      });
    }

    const { token, password } = validationResult.data;

    // Call service layer
    const result = await authService.confirmPasswordReset({ token, password });

    return res.status(200).json({
      message: result.message,
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);

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
        message: 'Invalid password reset data',
        details: errors as Record<string, string[]>,
      });
    }

    return res.status(500).json({
      error: 'Internal',
      message: 'Password reset failed. Please try again.',
    });
  }
}


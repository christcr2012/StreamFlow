// src/pages/api/auth/password-reset/confirm.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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

    // Hash the token to match stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiry: {
          gte: new Date(), // Token not expired
        },
      },
      select: {
        id: true,
        orgId: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        error: 'InvalidToken',
        message: 'Invalid or expired reset token',
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        mustChangePassword: false,
        updatedAt: new Date(),
      },
    });

    // Log the password reset in audit log
    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        actorId: user.id,
        action: 'user.password_reset_completed',
        entityType: 'user',
        entityId: user.id,
        delta: {
          email: user.email,
          completedAt: new Date().toISOString(),
        },
      },
    });

    // Invalidate all existing sessions for security
    await prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    return res.status(200).json({
      message: 'Password reset successful. Please log in with your new password.',
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    
    return res.status(500).json({
      error: 'Internal',
      message: 'Password reset failed. Please try again.',
    });
  }
}


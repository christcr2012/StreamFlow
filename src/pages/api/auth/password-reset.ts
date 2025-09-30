// src/pages/api/auth/password-reset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
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
}

interface SuccessResponse {
  message: string;
}

// Simple in-memory rate limiting (TODO: Move to Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 3; // 3 attempts per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
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

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'TooManyRequests',
      message: 'Too many password reset attempts. Please try again later.',
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, orgId: true, email: true, name: true },
    });

    // SECURITY: Always return 202 regardless of whether user exists
    // This prevents email enumeration attacks
    if (!user) {
      // Log the attempt for security monitoring
      console.log(`Password reset requested for non-existent email: ${email}`);
      
      return res.status(202).json({
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database
    // TODO: Create PasswordResetToken model in schema
    // For now, we'll use a simple approach with User model fields
    // In production, use a separate PasswordResetToken table
    
    await prisma.$executeRaw`
      UPDATE "User"
      SET "passwordResetToken" = ${resetTokenHash},
          "passwordResetExpiry" = ${resetTokenExpiry}
      WHERE "id" = ${user.id}
    `;

    // Log the reset request in audit log
    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        actorId: user.id,
        action: 'user.password_reset_requested',
        entityType: 'user',
        entityId: user.id,
        delta: {
          email: user.email,
          requestedAt: new Date().toISOString(),
        },
      },
    });

    // TODO: Send email with reset link
    // For now, log the reset token (REMOVE IN PRODUCTION)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password/${resetToken}`);

    // SECURITY: Always return same response regardless of whether user exists
    return res.status(202).json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    
    return res.status(500).json({
      error: 'Internal',
      message: 'Password reset request failed. Please try again.',
    });
  }
}


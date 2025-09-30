// src/server/services/authService.ts
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

// ===== TYPES & SCHEMAS =====

export const RegisterInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantInvite: z.string().optional(),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;

export interface RegisterResult {
  userId: string;
  orgId: string;
  email: string;
}

export interface PasswordResetRequestResult {
  success: boolean;
  message: string;
}

export interface PasswordResetConfirmResult {
  success: boolean;
  message: string;
}

// ===== SERVICE ERRORS =====

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// ===== AUTH SERVICE =====

export class AuthService {
  /**
   * Register a new user and create their organization
   */
  async register(input: RegisterInput): Promise<RegisterResult> {
    // Validate input
    const validated = RegisterInputSchema.parse(input);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ServiceError(
        'Email already registered',
        'CONFLICT',
        409
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Handle tenant invitation or create new organization
    if (validated.tenantInvite) {
      // TODO: Implement tenant invitation logic
      throw new ServiceError(
        'Tenant invitations not yet implemented',
        'NOT_IMPLEMENTED',
        422
      );
    }

    // Create new organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.org.create({
        data: {
          name: `${validated.name}'s Organization`,
          plan: 'STARTER',
        },
      });

      // Create user as organization owner
      const user = await tx.user.create({
        data: {
          orgId: org.id,
          email: validated.email.toLowerCase(),
          name: validated.name,
          passwordHash,
          role: 'OWNER',
          status: 'active',
          emailVerified: false,
        },
      });

      // Create default OWNER role for this org
      const ownerRole = await tx.rbacRole.upsert({
        where: {
          orgId_slug: {
            orgId: org.id,
            slug: 'owner',
          },
        },
        create: {
          orgId: org.id,
          name: 'Owner',
          slug: 'owner',
          isSystem: true,
        },
        update: {},
      });

      // Assign OWNER role to user
      await tx.rbacUserRole.create({
        data: {
          orgId: org.id,
          userId: user.id,
          roleId: ownerRole.id,
        },
      });

      // Log registration in audit log
      await tx.auditLog.create({
        data: {
          orgId: org.id,
          actorId: user.id,
          action: 'user.register',
          entityType: 'user',
          entityId: user.id,
          delta: {
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });

      return { org, user };
    });

    return {
      userId: result.user.id,
      orgId: result.org.id,
      email: result.user.email,
    };
  }

  /**
   * Request a password reset
   */
  async requestPasswordReset(input: PasswordResetRequestInput): Promise<PasswordResetRequestResult> {
    // Validate input
    const validated = PasswordResetRequestSchema.parse(input);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      select: { id: true, orgId: true, email: true, name: true },
    });

    // SECURITY: Always return success regardless of whether user exists
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${validated.email}`);
      return {
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpiry: resetTokenExpiry,
      },
    });

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
    console.log(`Password reset token for ${validated.email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password/${resetToken}`);

    return {
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.',
    };
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(input: PasswordResetConfirmInput): Promise<PasswordResetConfirmResult> {
    // Validate input
    const validated = PasswordResetConfirmSchema.parse(input);

    // Hash the token to match stored hash
    const tokenHash = crypto.createHash('sha256').update(validated.token).digest('hex');

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
      throw new ServiceError(
        'Invalid or expired reset token',
        'INVALID_TOKEN',
        400
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(validated.password, 12);

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

    return {
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    };
  }
}

// Export singleton instance
export const authService = new AuthService();


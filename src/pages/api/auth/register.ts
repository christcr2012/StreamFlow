// src/pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Email validation regex (RFC5322 simplified)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Registration request schema
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').regex(emailRegex, 'Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  tenantInvite: z.string().optional(), // Optional tenant invitation code
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterRequest = z.infer<typeof registerSchema>;

interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

interface SuccessResponse {
  userId: string;
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Handle tenant invitation or create new organization
    let orgId: string;
    let userId: string;

    if (tenantInvite) {
      // TODO: Implement tenant invitation logic
      // For now, reject invitations as not implemented
      return res.status(422).json({
        error: 'NotImplemented',
        message: 'Tenant invitations not yet implemented',
      });
    } else {
      // Create new organization and user
      const result = await prisma.$transaction(async (tx) => {
        // Create organization
        const org = await tx.org.create({
          data: {
            name: `${name}'s Organization`,
            plan: 'STARTER',
          },
        });

        // Create user as organization owner
        const user = await tx.user.create({
          data: {
            orgId: org.id,
            email: email.toLowerCase(),
            name,
            passwordHash,
            role: 'OWNER',
            status: 'active',
            emailVerified: false, // TODO: Implement email verification
          },
        });

        // Create default OWNER role for this org if it doesn't exist
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

      orgId = result.org.id;
      userId = result.user.id;
    }

    // Return success response
    return res.status(201).json({
      userId,
      message: 'Registration successful',
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Email already registered',
        });
      }
    }

    return res.status(500).json({
      error: 'Internal',
      message: 'Registration failed. Please try again.',
    });
  }
}


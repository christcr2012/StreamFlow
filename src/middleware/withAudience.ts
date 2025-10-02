import type { NextApiRequest, NextApiResponse } from 'next';
import { auditLog } from '@/server/services/auditService';

// User type detection based on cookies/headers
export type UserType = 'PROVIDER' | 'DEVELOPER' | 'ACCOUNTANT' | 'CLIENT' | 'PUBLIC';

// Audience configurations
export const AUDIENCE = {
  CLIENT_ONLY: { allowed: ['CLIENT'], description: 'Client users only' },
  PROVIDER_ONLY: { allowed: ['PROVIDER'], description: 'Provider users only' },
  DEVELOPER_ONLY: { allowed: ['DEVELOPER'], description: 'Developer users only' },
  ACCOUNTANT_ONLY: { allowed: ['ACCOUNTANT'], description: 'Accountant users only' },
  CLIENT_OR_PROVIDER: { allowed: ['CLIENT', 'PROVIDER'], description: 'Client or Provider users' },
  PUBLIC: { allowed: ['PUBLIC', 'CLIENT', 'PROVIDER', 'DEVELOPER', 'ACCOUNTANT'], description: 'Public access' },
} as const;

export type AudienceConfig = typeof AUDIENCE[keyof typeof AUDIENCE];

/**
 * Detect user type from cookies/headers
 * Priority: PROVIDER > DEVELOPER > ACCOUNTANT > CLIENT > PUBLIC
 */
export function getUserType(req: NextApiRequest): UserType {
  // Check for provider cookie/header
  if (req.cookies['provider-session'] || req.headers['x-provider-session']) {
    return 'PROVIDER';
  }

  // Check for developer cookie/header
  if (req.cookies['developer-session'] || req.headers['x-developer-session']) {
    return 'DEVELOPER';
  }

  // Check for accountant cookie/header
  if (req.cookies['accountant-session'] || req.headers['x-accountant-session']) {
    return 'ACCOUNTANT';
  }

  // Check for client session
  if (req.cookies['next-auth.session-token'] || req.headers['authorization']) {
    return 'CLIENT';
  }

  // Default to public
  return 'PUBLIC';
}

/**
 * Extract orgId from headers or query
 */
export function getOrgId(req: NextApiRequest): string {
  // Try header first
  const headerOrgId = req.headers['x-org-id'] as string;
  if (headerOrgId) return headerOrgId;

  // Try query parameter
  const queryOrgId = req.query.orgId as string;
  if (queryOrgId) return queryOrgId;

  // Default for testing
  return 'org_test';
}

/**
 * Verify user has access to the orgId
 * In production, this would check database permissions
 */
export async function verifyOrgAccess(
  userType: UserType,
  orgId: string,
  email?: string
): Promise<boolean> {
  // Provider and Developer have access to all orgs
  if (userType === 'PROVIDER' || userType === 'DEVELOPER') {
    return true;
  }

  // Accountant has access to orgs they're assigned to
  // In production, check database for accountant assignments
  if (userType === 'ACCOUNTANT') {
    return true; // Simplified for now
  }

  // Client users must belong to the org
  // In production, check user.orgId === orgId
  if (userType === 'CLIENT') {
    return true; // Simplified for now
  }

  // Public has no org access
  return false;
}

/**
 * Middleware to enforce audience restrictions
 * Returns 401 for unauthenticated, 403 for unauthorized
 */
export function withAudience(
  audienceConfig: AudienceConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const userType = getUserType(req);
      const orgId = getOrgId(req);
      const email = req.headers['x-user-email'] as string || req.headers['x-user-id'] as string;

      // Check if user type is allowed
      if (!audienceConfig.allowed.includes(userType as any)) {
        // Audit the denial
        await auditLog({
          orgId,
          actorId: email || 'anonymous',
          action: 'audience_deny',
          entityType: 'audience',
          entityId: audienceConfig.description,
          delta: {
            userType,
            allowed: audienceConfig.allowed,
            path: req.url,
          },
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. ${audienceConfig.description} required.`,
          details: {
            userType,
            required: audienceConfig.allowed,
          },
        });
      }

      // Verify org access for non-public routes
      if (userType !== 'PUBLIC') {
        const hasAccess = await verifyOrgAccess(userType, orgId, email);
        if (!hasAccess) {
          // Audit the denial
          await auditLog({
            orgId,
            actorId: email || 'anonymous',
            action: 'org_access_deny',
            entityType: 'audience',
            entityId: orgId,
            delta: {
              userType,
              path: req.url,
            },
          });

          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied to this organization',
          });
        }
      }

      // Audit successful access
      await auditLog({
        orgId,
        actorId: email || 'anonymous',
        action: 'audience_pass',
        entityType: 'audience',
        entityId: audienceConfig.description,
        delta: {
          userType,
          path: req.url,
        },
      });

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error('Error in withAudience:', error);
      return res.status(500).json({
        error: 'Internal',
        message: 'Audience check failed',
      });
    }
  };
}

/**
 * Helper to extract user info in handlers
 */
export function getUserInfo(req: NextApiRequest): { orgId: string; email?: string; userType: UserType } {
  const orgId = getOrgId(req);
  const email = req.headers['x-user-email'] as string || req.headers['x-user-id'] as string;
  const userType = getUserType(req);

  return { orgId, email, userType };
}


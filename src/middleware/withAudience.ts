// src/middleware/withAudience.ts
// RBAC middleware for API routes - enforces role-based access control
// Part of TASK 3: FSM Guardrails

import type { NextApiRequest, NextApiResponse } from 'next';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

// ===== TYPES =====

export type Audience = 'CLIENT' | 'PROVIDER' | 'DEVELOPER' | 'ACCOUNTANT' | 'PUBLIC';

export interface AudienceConfig {
  allowed: Audience[];
  requireAuth?: boolean;
  requireOrgId?: boolean;
}

// ===== PREDEFINED CONFIGS =====

export const AUDIENCE = {
  CLIENT_ONLY: {
    allowed: ['CLIENT'],
    requireAuth: true,
    requireOrgId: true,
  },
  PROVIDER_ONLY: {
    allowed: ['PROVIDER'],
    requireAuth: true,
    requireOrgId: false,
  },
  DEVELOPER_ONLY: {
    allowed: ['DEVELOPER'],
    requireAuth: true,
    requireOrgId: false,
  },
  ACCOUNTANT_ONLY: {
    allowed: ['ACCOUNTANT'],
    requireAuth: true,
    requireOrgId: false,
  },
  CLIENT_OR_PROVIDER: {
    allowed: ['CLIENT', 'PROVIDER'],
    requireAuth: true,
    requireOrgId: false,
  },
  PUBLIC: {
    allowed: ['PUBLIC', 'CLIENT', 'PROVIDER', 'DEVELOPER', 'ACCOUNTANT'],
    requireAuth: false,
    requireOrgId: false,
  },
} as const;

// ===== HELPER FUNCTIONS =====

/**
 * Get user type from request
 * Checks cookies and headers to determine user type
 */
function getUserType(req: NextApiRequest): Audience {
  // Check provider auth
  const providerEmail = req.cookies['provider-email'];
  if (providerEmail) {
    return 'PROVIDER';
  }

  // Check developer auth
  const developerEmail = req.cookies['developer-email'];
  if (developerEmail) {
    return 'DEVELOPER';
  }

  // Check accountant auth
  const accountantEmail = req.cookies['accountant-email'];
  if (accountantEmail) {
    return 'ACCOUNTANT';
  }

  // Check client auth
  const clientEmail = getEmailFromReq(req);
  if (clientEmail) {
    return 'CLIENT';
  }

  return 'PUBLIC';
}

/**
 * Get orgId from request
 * Checks headers and query parameters
 */
function getOrgId(req: NextApiRequest): string | null {
  // Check header (preferred)
  const headerOrgId = req.headers['x-org-id'] as string;
  if (headerOrgId) {
    return headerOrgId;
  }

  // Check query parameter (fallback)
  const queryOrgId = req.query.orgId as string;
  if (queryOrgId) {
    return queryOrgId;
  }

  return null;
}

/**
 * Verify user has access to the specified orgId
 */
async function verifyOrgAccess(email: string, orgId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    return user?.orgId === orgId;
  } catch (error) {
    console.error('Error verifying org access:', error);
    return false;
  }
}

// ===== MIDDLEWARE =====

/**
 * withAudience - RBAC middleware for API routes
 * 
 * Usage:
 *   export default withAudience(AUDIENCE.CLIENT_ONLY, handler);
 * 
 * Features:
 * - Enforces role-based access control
 * - Validates orgId for tenant-scoped routes
 * - Audit logs access attempts
 * - Returns 401 for unauthenticated, 403 for unauthorized
 */
export function withAudience(
  config: AudienceConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const userType = getUserType(req);

    // Check if user type is allowed
    if (!config.allowed.includes(userType)) {
      // Audit log access denial
      try {
        await prisma.auditLog.create({
          data: {
            orgId: 'SYSTEM',
            actorId: 'SYSTEM',
            action: 'access_denied',
            entityType: 'api',
            entityId: req.url || 'unknown',
            delta: {
              userType,
              allowed: config.allowed,
              method: req.method,
              path: req.url,
            },
          },
        });
      } catch (error) {
        console.error('Failed to log access denial:', error);
      }

      if (userType === 'PUBLIC' && config.requireAuth) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required: ${config.allowed.join(' or ')}`,
      });
    }

    // Check orgId if required
    if (config.requireOrgId) {
      const orgId = getOrgId(req);

      if (!orgId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Organization ID required (x-org-id header or orgId query param)',
        });
      }

      // Verify user has access to this org (for CLIENT users)
      if (userType === 'CLIENT') {
        const email = getEmailFromReq(req);
        if (!email) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
          });
        }

        const hasAccess = await verifyOrgAccess(email, orgId);
        if (!hasAccess) {
          // Audit log unauthorized org access attempt
          try {
            await prisma.auditLog.create({
              data: {
                orgId: 'SYSTEM',
                actorId: email,
                action: 'unauthorized_org_access',
                entityType: 'api',
                entityId: req.url || 'unknown',
                delta: {
                  requestedOrgId: orgId,
                  method: req.method,
                  path: req.url,
                },
              },
            });
          } catch (error) {
            console.error('Failed to log unauthorized org access:', error);
          }

          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied to this organization',
          });
        }
      }
    }

    // Audit log successful access (for non-PUBLIC routes)
    if (userType !== 'PUBLIC') {
      try {
        const email = userType === 'CLIENT' ? getEmailFromReq(req) : req.cookies[`${userType.toLowerCase()}-email`];
        await prisma.auditLog.create({
          data: {
            orgId: getOrgId(req) || 'SYSTEM',
            actorId: email || 'UNKNOWN',
            action: 'api_access',
            entityType: 'api',
            entityId: req.url || 'unknown',
            delta: {
              userType,
              method: req.method,
              path: req.url,
            },
          },
        });
      } catch (error) {
        console.error('Failed to log API access:', error);
      }
    }

    // Call the actual handler
    await handler(req, res);
  };
}

/**
 * Helper to extract user info from request (for use in handlers)
 */
export function getUserInfo(req: NextApiRequest): {
  userType: Audience;
  email: string | null;
  orgId: string | null;
} {
  const userType = getUserType(req);
  let email: string | null = null;

  if (userType === 'CLIENT') {
    email = getEmailFromReq(req);
  } else if (userType !== 'PUBLIC') {
    email = req.cookies[`${userType.toLowerCase()}-email`] || null;
  }

  const orgId = getOrgId(req);

  return { userType, email, orgId };
}


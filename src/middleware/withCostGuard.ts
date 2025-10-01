// src/middleware/withCostGuard.ts
// Cost control middleware for API routes - enforces credit/budget limits
// Part of TASK 3: FSM Guardrails

import type { NextApiRequest, NextApiResponse } from 'next';
import { checkAiBudget } from '@/lib/aiMeter';
import { prisma } from '@/lib/prisma';

// ===== TYPES =====

export interface CostGuardConfig {
  feature: string;
  estimatedCredits: number;
  fallbackResponse?: any;
  requireOrgId?: boolean;
}

// ===== PREDEFINED CONFIGS =====

export const COST_GUARD = {
  // AI Features
  AI_LEAD_SCORING: {
    feature: 'lead_scoring',
    estimatedCredits: 10,
    requireOrgId: true,
  },
  AI_OPPORTUNITY_SCORING: {
    feature: 'opportunity_scoring',
    estimatedCredits: 10,
    requireOrgId: true,
  },
  AI_CONTACT_ENRICHMENT: {
    feature: 'contact_enrichment',
    estimatedCredits: 15,
    requireOrgId: true,
  },
  AI_ESTIMATE_DRAFT: {
    feature: 'estimate_draft',
    estimatedCredits: 20,
    requireOrgId: true,
  },
  AI_ROUTE_OPTIMIZER: {
    feature: 'route_optimizer',
    estimatedCredits: 25,
    requireOrgId: true,
  },
  AI_FOLLOW_UP_DRAFT: {
    feature: 'follow_up_draft',
    estimatedCredits: 15,
    requireOrgId: true,
  },
  AI_INBOX_AGENT: {
    feature: 'inbox_agent',
    estimatedCredits: 20,
    requireOrgId: true,
  },
  AI_COLLECTIONS_AGENT: {
    feature: 'collections_agent',
    estimatedCredits: 20,
    requireOrgId: true,
  },
  AI_MARKETING_AGENT: {
    feature: 'marketing_agent',
    estimatedCredits: 25,
    requireOrgId: true,
  },
  AI_SCHEDULING_AGENT: {
    feature: 'scheduling_agent',
    estimatedCredits: 20,
    requireOrgId: true,
  },
  AI_DISPATCH_AGENT: {
    feature: 'dispatch_agent',
    estimatedCredits: 20,
    requireOrgId: true,
  },

  // Communication Features
  EMAIL_SEND: {
    feature: 'email_send',
    estimatedCredits: 1,
    requireOrgId: true,
  },
  SMS_SEND: {
    feature: 'sms_send',
    estimatedCredits: 2,
    requireOrgId: true,
  },

  // Storage Features
  FILE_UPLOAD: {
    feature: 'file_upload',
    estimatedCredits: 5,
    requireOrgId: true,
  },
  FILE_STORAGE: {
    feature: 'file_storage',
    estimatedCredits: 1,
    requireOrgId: true,
  },

  // External API Features
  EXTERNAL_API_CALL: {
    feature: 'external_api',
    estimatedCredits: 10,
    requireOrgId: true,
  },
} as const;

// ===== HELPER FUNCTIONS =====

/**
 * Get orgId from request
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

  // Check body (last resort)
  if (req.body && typeof req.body === 'object' && 'orgId' in req.body) {
    return req.body.orgId as string;
  }

  return null;
}

/**
 * Get userId from request
 */
function getUserId(req: NextApiRequest): string {
  // Check header (preferred)
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId) {
    return headerUserId;
  }

  // Fallback to 'system' for provider/developer/accountant
  return 'system';
}

// ===== MIDDLEWARE =====

/**
 * withCostGuard - Cost control middleware for API routes
 * 
 * Usage:
 *   export default withCostGuard(COST_GUARD.AI_LEAD_SCORING, handler);
 * 
 * Features:
 * - Checks AI budget before execution
 * - Enforces credit limits
 * - Returns 402 (Payment Required) if insufficient credits
 * - Audit logs cost-gated access attempts
 * - Supports fallback responses
 */
export function withCostGuard(
  config: CostGuardConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get orgId
    const orgId = getOrgId(req);

    if (config.requireOrgId && !orgId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Organization ID required for cost-gated operation',
      });
    }

    // If no orgId, skip cost guard (for provider/developer routes)
    if (!orgId) {
      return handler(req, res);
    }

    // Check budget
    const budgetCheck = await checkAiBudget(orgId, config.feature, config.estimatedCredits);

    if (!budgetCheck.allowed) {
      // Audit log cost gate denial
      try {
        const userId = getUserId(req);
        await prisma.auditLog.create({
          data: {
            orgId,
            actorId: userId,
            action: 'cost_gate_denied',
            entityType: 'api',
            entityId: req.url || 'unknown',
            delta: {
              feature: config.feature,
              estimatedCredits: config.estimatedCredits,
              reason: budgetCheck.reason,
              creditsRemaining: budgetCheck.creditsRemaining,
              method: req.method,
              path: req.url,
            },
          },
        });
      } catch (error) {
        console.error('Failed to log cost gate denial:', error);
      }

      // Return 402 Payment Required
      return res.status(402).json({
        error: 'PaymentRequired',
        message: budgetCheck.reason || 'Insufficient credits',
        details: {
          feature: config.feature,
          estimatedCredits: config.estimatedCredits,
          creditsRemaining: budgetCheck.creditsRemaining,
        },
        fallback: config.fallbackResponse,
      });
    }

    // Audit log successful cost gate pass
    try {
      const userId = getUserId(req);
      await prisma.auditLog.create({
        data: {
          orgId,
          actorId: userId,
          action: 'cost_gate_passed',
          entityType: 'api',
          entityId: req.url || 'unknown',
          delta: {
            feature: config.feature,
            estimatedCredits: config.estimatedCredits,
            creditsRemaining: budgetCheck.creditsRemaining,
            method: req.method,
            path: req.url,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log cost gate pass:', error);
    }

    // Call the actual handler
    await handler(req, res);
  };
}

/**
 * Combine withAudience and withCostGuard
 * 
 * Usage:
 *   export default withAudienceAndCostGuard(
 *     AUDIENCE.CLIENT_ONLY,
 *     COST_GUARD.AI_LEAD_SCORING,
 *     handler
 *   );
 */
export function withAudienceAndCostGuard(
  audienceConfig: any,
  costConfig: CostGuardConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  // Import withAudience dynamically to avoid circular dependency
  const { withAudience } = require('./withAudience');
  
  // Apply cost guard first, then audience
  return withAudience(audienceConfig, withCostGuard(costConfig, handler));
}

/**
 * Helper to get cost info for a feature (for use in handlers)
 */
export async function getCostInfo(orgId: string, feature: string, estimatedCredits: number): Promise<{
  allowed: boolean;
  reason?: string;
  creditsRemaining: number;
}> {
  return checkAiBudget(orgId, feature, estimatedCredits);
}


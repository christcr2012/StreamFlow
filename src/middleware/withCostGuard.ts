import type { NextApiRequest, NextApiResponse } from 'next';
import { checkAiBudget } from '@/lib/aiMeter';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from './withAudience';

// Cost configurations for different operations (in credits)
// 1 credit = $0.05 client-facing value
export const COST_GUARD = {
  // AI Operations
  AI_LEAD_SCORING: { credits: 10, description: 'AI Lead Scoring' },
  AI_OPPORTUNITY_SCORING: { credits: 10, description: 'AI Opportunity Scoring' },
  AI_CONTACT_ENRICHMENT: { credits: 15, description: 'AI Contact Enrichment' },
  AI_ESTIMATE_DRAFT: { credits: 20, description: 'AI Estimate Draft' },
  AI_ROUTE_OPTIMIZER: { credits: 25, description: 'AI Route Optimizer' },
  AI_EMAIL_DRAFT: { credits: 5, description: 'AI Email Draft' },
  AI_SMS_DRAFT: { credits: 3, description: 'AI SMS Draft' },
  AI_REPLY_DRAFT: { credits: 5, description: 'AI Reply Draft' },
  AI_QA_SUMMARY: { credits: 8, description: 'AI QA Summary' },
  
  // Communication
  EMAIL_SEND: { credits: 1, description: 'Email Send' },
  SMS_SEND: { credits: 2, description: 'SMS Send' },
  
  // Storage & Egress
  FILE_UPLOAD: { credits: 5, description: 'File Upload' },
  FILE_DOWNLOAD: { credits: 2, description: 'File Download' },
  
  // External APIs
  MAPS_GEOCODE: { credits: 3, description: 'Maps Geocoding' },
  MAPS_DIRECTIONS: { credits: 5, description: 'Maps Directions' },
} as const;

export type CostGuardConfig = typeof COST_GUARD[keyof typeof COST_GUARD];

/**
 * Middleware to enforce cost controls on costed actions
 * Returns 402 Payment Required if insufficient credits
 */
export function withCostGuard(
  costConfig: CostGuardConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const { orgId, email } = getUserInfo(req);
      const userId = email || 'user_test';

      // Check AI budget
      const budgetCheck = await checkAiBudget(orgId, costConfig.credits);

      if (!budgetCheck.allowed) {
        // Audit the denial
        await auditLog({
          orgId,
          actorId: userId,
          action: 'cost_guard_deny',
          entityType: 'cost_guard',
          entityId: costConfig.description,
          delta: {
            credits: costConfig.credits,
            balance: budgetCheck.balance,
            reason: budgetCheck.reason,
          },
        });

        return res.status(402).json({
          error: 'PaymentRequired',
          message: budgetCheck.reason || 'Insufficient credits',
          details: {
            credits: costConfig.credits,
            balance: budgetCheck.balance,
            description: costConfig.description,
          },
        });
      }

      // Audit the pass
      await auditLog({
        orgId,
        actorId: userId,
        action: 'cost_guard_pass',
        entityType: 'cost_guard',
        entityId: costConfig.description,
        delta: {
          credits: costConfig.credits,
          balance: budgetCheck.balance,
        },
      });

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error('Error in withCostGuard:', error);
      return res.status(500).json({
        error: 'Internal',
        message: 'Cost guard check failed',
      });
    }
  };
}

/**
 * Combined middleware: withAudience + withCostGuard
 * Applies both RBAC and cost control
 */
export function withAudienceAndCostGuard(
  audience: typeof AUDIENCE[keyof typeof AUDIENCE],
  costConfig: CostGuardConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  // First apply audience check, then cost guard
  return withAudience(audience, withCostGuard(costConfig, handler));
}

/**
 * Helper to get cost info for a specific guard
 */
export function getCostInfo(costConfig: CostGuardConfig) {
  return {
    credits: costConfig.credits,
    description: costConfig.description,
    estimatedCost: (costConfig.credits * 0.05).toFixed(2), // $0.05 per credit
  };
}


// src/middleware/policy-enforcement.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma as db } from '@/lib/prisma';
import { auditAction } from '@/lib/audit';

export interface PolicyEnforcementContext {
  orgId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionDuration?: number;
  action: string;
  resource?: string;
}

export interface PolicyViolation {
  policyId: string;
  policyName: string;
  category: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blockAccess: boolean;
}

/**
 * Central policy enforcement engine
 */
export class PolicyEnforcer {
  private static instance: PolicyEnforcer;
  private policyCache = new Map<string, any[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): PolicyEnforcer {
    if (!PolicyEnforcer.instance) {
      PolicyEnforcer.instance = new PolicyEnforcer();
    }
    return PolicyEnforcer.instance;
  }

  /**
   * Main policy enforcement entry point
   */
  async enforcePolicy(
    context: PolicyEnforcementContext,
    req?: NextApiRequest
  ): Promise<{ allowed: boolean; violations: PolicyViolation[] }> {
    const violations: PolicyViolation[] = [];

    try {
      // Get applicable policies for the organization
      const policies = await this.getPolicies(context.orgId);

      // Enforce each policy category
      for (const policy of policies) {
        if (!policy.enabled) continue;

        const violation = await this.checkPolicy(policy, context);
        if (violation) {
          violations.push(violation);
        }
      }

      // Determine if access should be blocked
      const blockingViolations = violations.filter(v => v.blockAccess);
      const allowed = blockingViolations.length === 0;

      // Audit policy enforcement
      if (req && violations.length > 0) {
        await auditAction(req, {
          action: 'policy_enforcement',
          target: 'security_policy',
          category: 'SECURITY_EVENT',
          severity: blockingViolations.length > 0 ? 'WARNING' : 'INFO',
          details: {
            action: context.action,
            violations: violations.map(v => ({
              policy: v.policyName,
              reason: v.reason,
              severity: v.severity,
            })),
            blocked: !allowed,
          },
        });
      }

      return { allowed, violations };
    } catch (error) {
      console.error('Policy enforcement error:', error);
      // Fail secure - deny access if policy enforcement fails
      return {
        allowed: false,
        violations: [{
          policyId: 'system',
          policyName: 'System Error',
          category: 'SYSTEM',
          reason: 'Policy enforcement system error',
          severity: 'CRITICAL',
          blockAccess: true,
        }],
      };
    }
  }

  /**
   * Get policies for organization with caching
   */
  private async getPolicies(orgId: string): Promise<any[]> {
    const cacheKey = `policies_${orgId}`;
    const now = Date.now();

    // Check cache
    if (this.policyCache.has(cacheKey) && 
        this.cacheExpiry.get(cacheKey)! > now) {
      return this.policyCache.get(cacheKey)!;
    }

    // Fetch from database
    const policies = await db.securityPolicy.findMany({
      where: {
        orgId,
        enabled: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Cache policies
    this.policyCache.set(cacheKey, policies);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

    return policies;
  }

  /**
   * Check individual policy against context
   */
  private async checkPolicy(
    policy: any, 
    context: PolicyEnforcementContext
  ): Promise<PolicyViolation | null> {
    const config = policy.config as any;

    switch (policy.category) {
      case 'AUTHENTICATION':
        return this.checkAuthenticationPolicy(policy, config, context);
      
      case 'SECURITY':
        return this.checkSecurityPolicy(policy, config, context);
      
      case 'NETWORK_SECURITY':
        return this.checkNetworkPolicy(policy, config, context);
      
      case 'COMPLIANCE':
        return this.checkCompliancePolicy(policy, config, context);
      
      default:
        return null;
    }
  }

  /**
   * Authentication policy enforcement
   */
  private checkAuthenticationPolicy(
    policy: any, 
    config: any, 
    context: PolicyEnforcementContext
  ): PolicyViolation | null {
    if (policy.name === 'Password Policy' && context.action === 'password_change') {
      // Password validation is handled in auth flow
      return null;
    }

    if (policy.name === 'MFA Requirement' && context.action === 'login') {
      if (config.requireMFA && !context.userId) {
        return {
          policyId: policy.id,
          policyName: policy.name,
          category: policy.category,
          reason: 'Multi-factor authentication required',
          severity: 'HIGH',
          blockAccess: true,
        };
      }
    }

    return null;
  }

  /**
   * Security policy enforcement
   */
  private checkSecurityPolicy(
    policy: any, 
    config: any, 
    context: PolicyEnforcementContext
  ): PolicyViolation | null {
    if (policy.name === 'Session Management' && context.sessionDuration) {
      const maxDuration = config.maxSessionDuration * 60 * 1000; // Convert to ms
      
      if (context.sessionDuration > maxDuration) {
        return {
          policyId: policy.id,
          policyName: policy.name,
          category: policy.category,
          reason: `Session exceeded maximum duration of ${config.maxSessionDuration} minutes`,
          severity: 'HIGH',
          blockAccess: true,
        };
      }

      // Idle timeout check
      if (config.idleTimeout && context.sessionDuration > config.idleTimeout * 60 * 1000) {
        return {
          policyId: policy.id,
          policyName: policy.name,
          category: policy.category,
          reason: `Session idle timeout exceeded`,
          severity: 'MEDIUM',
          blockAccess: true,
        };
      }
    }

    return null;
  }

  /**
   * Network security policy enforcement
   */
  private checkNetworkPolicy(
    policy: any, 
    config: any, 
    context: PolicyEnforcementContext
  ): PolicyViolation | null {
    if (policy.name === 'IP Allowlist' && context.ipAddress) {
      const allowedIPs = config.allowedIPs || [];
      const allowedCIDRs = config.allowedCIDRs || [];

      // Simple IP check (production would use proper CIDR matching)
      const ipAllowed = allowedIPs.includes(context.ipAddress) ||
                       allowedCIDRs.some((cidr: string) => context.ipAddress?.startsWith(cidr.split('/')[0]));

      if (!ipAllowed && allowedIPs.length > 0) {
        return {
          policyId: policy.id,
          policyName: policy.name,
          category: policy.category,
          reason: `IP address ${context.ipAddress} not in allowlist`,
          severity: 'HIGH',
          blockAccess: config.enforceStrict,
        };
      }
    }

    if (policy.name === 'Geo Blocking' && context.ipAddress) {
      const blockedCountries = config.blockedCountries || [];
      // In production, you would do actual geo-IP lookup
      // For now, just block known malicious IP patterns
      if (context.ipAddress.startsWith('192.168.') && blockedCountries.includes('TEST')) {
        return {
          policyId: policy.id,
          policyName: policy.name,
          category: policy.category,
          reason: 'Access from blocked geographic region',
          severity: 'HIGH',
          blockAccess: true,
        };
      }
    }

    return null;
  }

  /**
   * Compliance policy enforcement
   */
  private checkCompliancePolicy(
    policy: any, 
    config: any, 
    context: PolicyEnforcementContext
  ): PolicyViolation | null {
    if (policy.name === 'Data Retention' && context.action === 'data_access') {
      // Check if data is within retention period
      const retentionDays = config.retentionDays || 2555; // 7 years default
      // Implementation would check data age here
    }

    return null;
  }

  /**
   * Clear policy cache for organization
   */
  clearCache(orgId: string): void {
    const cacheKey = `policies_${orgId}`;
    this.policyCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
  }
}

/**
 * Express/Next.js middleware for automatic policy enforcement
 */
export function withPolicyEnforcement(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options?: {
    action?: string;
    resource?: string;
    skipOn?: (req: NextApiRequest) => boolean;
  }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip enforcement if configured
    if (options?.skipOn?.(req)) {
      return handler(req, res);
    }

    try {
      // Extract context from request
      const context = await extractPolicyContext(req, options);
      
      if (!context.orgId) {
        // No org context - continue without enforcement
        return handler(req, res);
      }

      // Enforce policies
      const enforcer = PolicyEnforcer.getInstance();
      const result = await enforcer.enforcePolicy(context, req);

      if (!result.allowed) {
        const blockingViolations = result.violations.filter(v => v.blockAccess);
        return res.status(403).json({
          error: 'Access denied by security policy',
          violations: blockingViolations.map(v => ({
            policy: v.policyName,
            reason: v.reason,
          })),
        });
      }

      // Add violations to response headers for monitoring
      if (result.violations.length > 0) {
        res.setHeader('X-Policy-Violations', JSON.stringify(
          result.violations.map(v => ({ policy: v.policyName, severity: v.severity }))
        ));
      }

      // Continue with original handler
      return handler(req, res);
    } catch (error) {
      console.error('Policy enforcement middleware error:', error);
      // Fail secure
      return res.status(500).json({ error: 'Security policy enforcement error' });
    }
  };
}

/**
 * Extract policy enforcement context from request
 */
async function extractPolicyContext(
  req: NextApiRequest,
  options?: { action?: string; resource?: string }
): Promise<PolicyEnforcementContext> {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress;

  // Try to get user context
  let orgId = '';
  let userId = '';
  let sessionDuration = 0;

  try {
    // This would integrate with your auth system
    const authHeader = req.headers.authorization || req.headers.cookie;
    if (authHeader) {
      // Extract user/org from auth token/cookie
      // Implementation depends on your auth system
    }
  } catch {
    // Continue without user context
  }

  return {
    orgId,
    userId,
    ipAddress: ip?.trim(),
    userAgent: req.headers['user-agent'],
    sessionDuration,
    action: options?.action || `${req.method?.toLowerCase()}_${options?.resource || 'resource'}`,
    resource: options?.resource,
  };
}
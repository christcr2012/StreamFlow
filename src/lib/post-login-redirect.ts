/**
 * 📍 POST-LOGIN REDIRECT SYSTEM
 * 
 * Post-login redirect hook for GitHub issue #9
 * Acceptance Criteria: After login, user lands at /tenant/{tenantId}/{space}/dashboard
 * Phase:1 Area:frontend Priority:high
 */

import type { NextApiRequest } from 'next';
import { consolidatedAudit } from './consolidated-audit';

export interface UserContext {
  id: string;
  email: string;
  name?: string;
  role: string;
  orgId: string;
  space: 'client' | 'provider' | 'developer' | 'accountant';
  tenantId: string;
  permissions?: string[];
}

export interface RedirectDestination {
  url: string;
  reason: string;
  space: string;
  tenantId?: string;
}

export interface RedirectRule {
  id: string;
  name: string;
  priority: number; // Higher number = higher priority
  condition: (user: UserContext, req?: NextApiRequest) => boolean;
  destination: (user: UserContext, req?: NextApiRequest) => RedirectDestination;
}

/**
 * Post-Login Redirect Service
 */
export class PostLoginRedirectService {
  private rules: RedirectRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default redirect rules
   */
  private initializeDefaultRules(): void {
    // Rule 1: Provider users go to provider portal
    this.addRule({
      id: 'provider-portal',
      name: 'Provider Portal Redirect',
      priority: 100,
      condition: (user) => user.space === 'provider',
      destination: (user) => ({
        url: '/provider/dashboard',
        reason: 'Provider user accessing provider portal',
        space: 'provider'
      })
    });

    // Rule 2: Developer users go to developer portal
    this.addRule({
      id: 'developer-portal',
      name: 'Developer Portal Redirect',
      priority: 90,
      condition: (user) => user.space === 'developer',
      destination: (user) => ({
        url: '/developer/dashboard',
        reason: 'Developer user accessing developer portal',
        space: 'developer'
      })
    });

    // Rule 3: Accountant users go to accountant portal
    this.addRule({
      id: 'accountant-portal',
      name: 'Accountant Portal Redirect',
      priority: 80,
      condition: (user) => user.space === 'accountant',
      destination: (user) => ({
        url: '/accountant/dashboard',
        reason: 'Accountant user accessing accountant portal',
        space: 'accountant'
      })
    });

    // Rule 4: Owner users go to tenant-specific dashboard
    this.addRule({
      id: 'owner-tenant-dashboard',
      name: 'Owner Tenant Dashboard',
      priority: 70,
      condition: (user) => user.space === 'client' && user.role === 'OWNER',
      destination: (user) => ({
        url: `/tenant/${user.tenantId}/client/dashboard`,
        reason: 'Owner user accessing tenant dashboard',
        space: 'client',
        tenantId: user.tenantId
      })
    });

    // Rule 5: Manager users go to tenant-specific dashboard
    this.addRule({
      id: 'manager-tenant-dashboard',
      name: 'Manager Tenant Dashboard',
      priority: 60,
      condition: (user) => user.space === 'client' && user.role === 'MANAGER',
      destination: (user) => ({
        url: `/tenant/${user.tenantId}/client/dashboard`,
        reason: 'Manager user accessing tenant dashboard',
        space: 'client',
        tenantId: user.tenantId
      })
    });

    // Rule 6: Staff users go to tenant-specific staff dashboard
    this.addRule({
      id: 'staff-tenant-dashboard',
      name: 'Staff Tenant Dashboard',
      priority: 50,
      condition: (user) => user.space === 'client' && user.role === 'STAFF',
      destination: (user) => ({
        url: `/tenant/${user.tenantId}/client/staff`,
        reason: 'Staff user accessing staff dashboard',
        space: 'client',
        tenantId: user.tenantId
      })
    });

    // Rule 7: Employee users go to tenant-specific employee dashboard
    this.addRule({
      id: 'employee-tenant-dashboard',
      name: 'Employee Tenant Dashboard',
      priority: 40,
      condition: (user) => user.space === 'client' && user.role === 'EMPLOYEE',
      destination: (user) => ({
        url: `/tenant/${user.tenantId}/client/employee`,
        reason: 'Employee user accessing employee dashboard',
        space: 'client',
        tenantId: user.tenantId
      })
    });

    // Rule 8: Fallback for client users
    this.addRule({
      id: 'client-fallback',
      name: 'Client Fallback Dashboard',
      priority: 10,
      condition: (user) => user.space === 'client',
      destination: (user) => ({
        url: `/tenant/${user.tenantId}/client/dashboard`,
        reason: 'Client user fallback to tenant dashboard',
        space: 'client',
        tenantId: user.tenantId
      })
    });

    // Rule 9: Ultimate fallback
    this.addRule({
      id: 'ultimate-fallback',
      name: 'Ultimate Fallback',
      priority: 1,
      condition: () => true, // Always matches
      destination: (user) => ({
        url: '/dashboard',
        reason: 'Ultimate fallback for unmatched users',
        space: user.space || 'client'
      })
    });
  }

  /**
   * Add a redirect rule
   */
  addRule(rule: RedirectRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
  }

  /**
   * Remove a redirect rule
   */
  removeRule(ruleId: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    return this.rules.length < initialLength;
  }

  /**
   * Get redirect destination for user
   */
  async getRedirectDestination(
    user: UserContext,
    req?: NextApiRequest
  ): Promise<RedirectDestination> {
    // Find the first matching rule (rules are sorted by priority)
    for (const rule of this.rules) {
      try {
        if (rule.condition(user, req)) {
          const destination = rule.destination(user, req);
          
          // Log the redirect decision
          await consolidatedAudit.logAuth(
            'LOGIN',
            user.email,
            'CLIENT',
            {
              ipAddress: req?.headers['x-forwarded-for'] as string || req?.connection?.remoteAddress,
              userAgent: req?.headers['user-agent'] as string
            },
            {
              action: 'POST_LOGIN_REDIRECT',
              userId: user.id,
              role: user.role,
              space: user.space,
              tenantId: user.tenantId,
              ruleId: rule.id,
              ruleName: rule.name,
              destination: destination.url,
              reason: destination.reason,
              timestamp: new Date().toISOString()
            }
          );

          return destination;
        }
      } catch (error) {
        console.error(`Error evaluating redirect rule ${rule.id}:`, error);
        // Continue to next rule if this one fails
      }
    }

    // This should never happen due to the ultimate fallback rule
    const fallback: RedirectDestination = {
      url: '/dashboard',
      reason: 'Emergency fallback - no rules matched',
      space: user.space || 'client'
    };

    await consolidatedAudit.logAuth(
      'LOGIN',
      user.email,
      'CLIENT',
      {
        ipAddress: req?.headers['x-forwarded-for'] as string || req?.connection?.remoteAddress,
        userAgent: req?.headers['user-agent'] as string
      },
      {
        action: 'POST_LOGIN_REDIRECT_FALLBACK',
        userId: user.id,
        role: user.role,
        space: user.space,
        tenantId: user.tenantId,
        destination: fallback.url,
        reason: fallback.reason,
        timestamp: new Date().toISOString()
      }
    );

    return fallback;
  }

  /**
   * Get all redirect rules (for debugging/admin)
   */
  getRules(): RedirectRule[] {
    return [...this.rules]; // Return a copy
  }

  /**
   * Test redirect rules against a user context
   */
  async testRedirectRules(user: UserContext): Promise<Array<{
    rule: RedirectRule;
    matches: boolean;
    destination?: RedirectDestination;
    error?: string;
  }>> {
    const results = [];

    for (const rule of this.rules) {
      try {
        const matches = rule.condition(user);
        const result: any = { rule, matches };
        
        if (matches) {
          result.destination = rule.destination(user);
        }
        
        results.push(result);
      } catch (error) {
        results.push({
          rule,
          matches: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

/**
 * Global post-login redirect service instance
 */
export const postLoginRedirect = new PostLoginRedirectService();

/**
 * Helper function to create user context from API data
 */
export function createUserContext(
  user: any,
  space: 'client' | 'provider' | 'developer' | 'accountant'
): UserContext {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
    space,
    tenantId: user.orgId, // For now, tenantId is the same as orgId
    permissions: user.permissions || []
  };
}

/**
 * Helper function to handle post-login redirect in API routes
 */
export async function handlePostLoginRedirect(
  user: any,
  space: 'client' | 'provider' | 'developer' | 'accountant',
  req?: NextApiRequest
): Promise<RedirectDestination> {
  const userContext = createUserContext(user, space);
  return await postLoginRedirect.getRedirectDestination(userContext, req);
}

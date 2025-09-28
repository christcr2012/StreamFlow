/**
 * 🔐 ENTERPRISE AUTHENTICATION SERVICE
 * Complete system isolation with zero cross-contamination
 */

import type { NextApiRequest } from 'next';
import { getEmailFromReq } from './rbac';

export type SystemType = 'PROVIDER' | 'DEVELOPER' | 'CLIENT';
export type UserRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'PROVIDER' | 'DEVELOPER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  system: SystemType;
  role?: UserRole;
  permissions: string[];
}

export interface AuthenticationResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  redirectTo?: string;
}

class AuthenticationService {
  private providerEmail: string | undefined;
  private developerEmail: string | undefined;

  constructor() {
    this.providerEmail = process.env.PROVIDER_EMAIL?.toLowerCase();
    this.developerEmail = process.env.DEVELOPER_EMAIL?.toLowerCase();
  }

  /**
   * Determine which system a user belongs to based on their email
   */
  getUserSystem(email: string): SystemType | null {
    const normalizedEmail = email.toLowerCase();

    if (this.providerEmail && normalizedEmail === this.providerEmail) {
      return 'PROVIDER';
    }

    if (this.developerEmail && normalizedEmail === this.developerEmail) {
      return 'DEVELOPER';
    }

    // All other authenticated users are client users
    return 'CLIENT';
  }

  /**
   * Authenticate user from request and determine their system access
   */
  async authenticateRequest(req: NextApiRequest): Promise<AuthenticationResult> {
    try {
      const email = getEmailFromReq(req);
      
      if (!email) {
        return {
          success: false,
          error: 'No authentication found',
          redirectTo: '/login'
        };
      }

      const system = this.getUserSystem(email);
      
      if (!system) {
        return {
          success: false,
          error: 'Invalid user system',
          redirectTo: '/login'
        };
      }

      // Create authenticated user object
      const user: AuthenticatedUser = {
        id: system === 'PROVIDER' ? 'provider-system' : 
            system === 'DEVELOPER' ? 'developer-system' : 
            email, // For client users, use email as ID temporarily
        email,
        system,
        role: system === 'PROVIDER' ? 'PROVIDER' : 
              system === 'DEVELOPER' ? 'DEVELOPER' : 
              undefined, // Client roles determined by RBAC
        permissions: this.getSystemPermissions(system)
      };

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
        redirectTo: '/login'
      };
    }
  }

  /**
   * Validate that user has access to specific system routes
   */
  validateSystemAccess(user: AuthenticatedUser, requestedSystem: SystemType): boolean {
    return user.system === requestedSystem;
  }

  /**
   * Get system-specific permissions
   */
  private getSystemPermissions(system: SystemType): string[] {
    switch (system) {
      case 'PROVIDER':
        return [
          'provider:read',
          'provider:write',
          'analytics:cross_client',
          'monetization:manage',
          'federation:access',
          'billing:manage'
        ];
      
      case 'DEVELOPER':
        return [
          'developer:read',
          'developer:write',
          'system:monitor',
          'database:admin',
          'api:test',
          'debug:access',
          'logs:read'
        ];
      
      case 'CLIENT':
        return [
          'client:read',
          'client:write',
          'leads:manage',
          'dashboard:access'
        ];
      
      default:
        return [];
    }
  }

  /**
   * Get appropriate redirect URL for user's system
   */
  getSystemHomeUrl(system: SystemType): string {
    switch (system) {
      case 'PROVIDER':
        return '/provider';
      case 'DEVELOPER':
        return '/dev';
      case 'CLIENT':
        return '/dashboard';
      default:
        return '/login';
    }
  }

  /**
   * Validate route access for authenticated user
   */
  validateRouteAccess(user: AuthenticatedUser, pathname: string): {
    allowed: boolean;
    redirectTo?: string;
    reason?: string;
  } {
    const isProviderRoute = pathname.startsWith('/provider');
    const isDeveloperRoute = pathname.startsWith('/dev');
    const isClientRoute = ['/dashboard', '/leads', '/admin', '/owner', '/manager', '/staff', '/settings', '/profile', '/billing']
      .some(route => pathname.startsWith(route));

    // Provider routes
    if (isProviderRoute) {
      if (user.system !== 'PROVIDER') {
        return {
          allowed: false,
          redirectTo: this.getSystemHomeUrl(user.system),
          reason: `${user.system} user attempted to access PROVIDER route`
        };
      }
      return { allowed: true };
    }

    // Developer routes
    if (isDeveloperRoute) {
      if (user.system !== 'DEVELOPER') {
        return {
          allowed: false,
          redirectTo: this.getSystemHomeUrl(user.system),
          reason: `${user.system} user attempted to access DEVELOPER route`
        };
      }
      return { allowed: true };
    }

    // Client routes
    if (isClientRoute) {
      if (user.system !== 'CLIENT') {
        return {
          allowed: false,
          redirectTo: this.getSystemHomeUrl(user.system),
          reason: `${user.system} user attempted to access CLIENT route`
        };
      }
      return { allowed: true };
    }

    // Public or unprotected routes
    return { allowed: true };
  }

  /**
   * Log security violations
   */
  logSecurityViolation(user: AuthenticatedUser, pathname: string, reason: string): void {
    console.warn(`🚨 SECURITY VIOLATION: ${reason}`, {
      userId: user.id,
      userEmail: user.email,
      userSystem: user.system,
      attemptedPath: pathname,
      timestamp: new Date().toISOString()
    });

    // In production, this would send to security monitoring system
    // TODO: Integrate with security monitoring (e.g., Sentry, DataDog)
  }

  /**
   * Check if systems are properly configured
   */
  getSystemStatus(): {
    providerConfigured: boolean;
    developerConfigured: boolean;
    securityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  } {
    const providerConfigured = !!this.providerEmail;
    const developerConfigured = !!this.developerEmail;
    
    let securityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    
    if (providerConfigured && developerConfigured) {
      securityLevel = 'HIGH';
    } else if (providerConfigured || developerConfigured) {
      securityLevel = 'MEDIUM';
    }

    return {
      providerConfigured,
      developerConfigured,
      securityLevel
    };
  }
}

// Export singleton instance
export const authService = new AuthenticationService();

// Convenience functions for API routes
export async function requireProvider(req: NextApiRequest): Promise<AuthenticatedUser | null> {
  const result = await authService.authenticateRequest(req);
  if (!result.success || !result.user || result.user.system !== 'PROVIDER') {
    return null;
  }
  return result.user;
}

export async function requireDeveloper(req: NextApiRequest): Promise<AuthenticatedUser | null> {
  const result = await authService.authenticateRequest(req);
  if (!result.success || !result.user || result.user.system !== 'DEVELOPER') {
    return null;
  }
  return result.user;
}

export async function requireClient(req: NextApiRequest): Promise<AuthenticatedUser | null> {
  const result = await authService.authenticateRequest(req);
  if (!result.success || !result.user || result.user.system !== 'CLIENT') {
    return null;
  }
  return result.user;
}

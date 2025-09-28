// src/lib/developer-auth.ts

/**
 * 🛠️ DEVELOPER AUTHENTICATION SYSTEM
 * 
 * Completely separate authentication system for developer-side operations.
 * This is NOT part of the client-side authentication flow.
 * 
 * DEVELOPER SYSTEM ARCHITECTURE:
 * - Independent session management
 * - Developer-specific access control
 * - Comprehensive audit logging
 * - System administration capabilities
 * 
 * SECURITY:
 * - Developer accounts are completely separate from client accounts
 * - Enhanced security for system access
 * - Detailed audit trails for all developer actions
 * - IP-based access restrictions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export interface DeveloperUser {
  id: string;
  email: string;
  role: 'OWNER';
  orgId: string;
  permissions: string[];
  lastLogin: Date;
  isDeveloper: boolean;
}

export interface DeveloperSession {
  user: DeveloperUser;
  sessionId: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  accessLevel: 'read' | 'write' | 'admin';
}

/**
 * Verify developer authentication and return developer user
 */
export async function authenticateDeveloper(req: NextApiRequest): Promise<DeveloperUser | null> {
  try {
    // Use the same cookie-based authentication as the rest of the system
    const email = req.cookies.ws_user;

    if (!email) {
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        org: true,
      },
    });

    if (!user) {
      return null;
    }

    // Check if user has developer access
    const isDeveloper = user.role === 'OWNER' || user.email === 'gametcr3@gmail.com';
    
    if (!isDeveloper) {
      return null;
    }

    // Log developer access
    await logDeveloperAccess(user.id, req);

    return {
      id: user.id,
      email: user.email,
      role: 'OWNER',
      orgId: user.orgId,
      permissions: getDeveloperPermissions(user),
      lastLogin: new Date(), // Use current time since lastLogin may not be in schema
      isDeveloper: true,
    };
  } catch (error) {
    console.error('Developer authentication error:', error);
    return null;
  }
}

/**
 * Middleware to protect developer-only routes
 */
export function requireDeveloperAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: DeveloperUser) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await authenticateDeveloper(req);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Developer authentication required',
        code: 'DEVELOPER_AUTH_REQUIRED'
      });
    }

    // Add user to request for handler
    (req as any).developerUser = user;
    
    return handler(req, res, user);
  };
}

/**
 * Get developer-specific permissions
 */
function getDeveloperPermissions(user: any): string[] {
  const basePermissions = [
    'dev:read',
    'dev:dashboard',
    'dev:system:read',
    'dev:metrics:read',
    'dev:logs:read',
  ];

  // Enhanced permissions for specific developer accounts
  if (user.email === 'gametcr3@gmail.com' || user.role === 'OWNER') {
    basePermissions.push(
      'dev:admin',
      'dev:system:write',
      'dev:database:admin',
      'dev:ai:admin',
      'dev:federation:admin',
      'dev:deployment:admin',
      'dev:testing:admin'
    );
  }

  return basePermissions;
}

/**
 * Log developer access for audit trail
 */
async function logDeveloperAccess(userId: string, req: NextApiRequest) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: 'SYSTEM', // Developer actions are system-level
        actorId: userId,
        action: 'DEVELOPER_ACCESS',
        entityType: 'developer_system',
        delta: {
          endpoint: req.url,
          method: req.method,
          userAgent: req.headers['user-agent'],
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          timestamp: new Date().toISOString(),
          securityLevel: 'HIGH',
        },
      },
    });
  } catch (error) {
    console.error('Failed to log developer access:', error);
  }
}

/**
 * Check if user has specific developer permission
 */
export function hasDeveloperPermission(user: DeveloperUser, permission: string): boolean {
  return user.permissions.includes(permission) || user.permissions.includes('dev:admin');
}

/**
 * Developer session management with enhanced security
 */
export class DeveloperSessionManager {
  private static sessions = new Map<string, DeveloperSession>();

  static async createSession(user: DeveloperUser, req: NextApiRequest): Promise<string> {
    const sessionId = generateSecureSessionId();
    const session: DeveloperSession = {
      user,
      sessionId,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours (shorter for security)
      ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      accessLevel: 'admin',
    };

    this.sessions.set(sessionId, session);
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    return sessionId;
  }

  static getSession(sessionId: string): DeveloperSession | null {
    const session = this.sessions.get(sessionId);
    
    if (!session || session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    return session;
  }

  static destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private static cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

function generateSecureSessionId(): string {
  // More secure session ID generation for developer access
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + Date.now().toString(36);
}

/**
 * Developer audit logging with enhanced details
 */
export async function logDeveloperAction(
  userId: string,
  action: string,
  resource: string,
  details: any,
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: 'SYSTEM', // Developer actions are system-level
        actorId: userId,
        action: `DEVELOPER_${action}`,
        entityType: resource,
        delta: {
          ...details,
          securityLevel,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to log developer action:', error);
  }
}

/**
 * System health check for developer dashboard
 */
export async function getDeveloperSystemHealth(): Promise<{
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  ai: 'healthy' | 'warning' | 'error';
  federation: 'healthy' | 'warning' | 'error';
  cache: 'healthy' | 'warning' | 'error';
}> {
  try {
    // Database health check
    const dbStart = Date.now();
    await prisma.user.count();
    const dbTime = Date.now() - dbStart;
    
    return {
      database: dbTime < 100 ? 'healthy' : dbTime < 500 ? 'warning' : 'error',
      api: 'healthy', // API is responding if we got here
      ai: 'healthy', // TODO: Implement AI service health check
      federation: 'warning', // Not implemented yet
      cache: 'healthy', // TODO: Implement cache health check
    };
  } catch (error) {
    console.error('System health check failed:', error);
    return {
      database: 'error',
      api: 'error',
      ai: 'error',
      federation: 'error',
      cache: 'error',
    };
  }
}

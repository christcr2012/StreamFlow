// src/lib/provider-auth.ts

/**
 * Dual-Layer Provider Authentication System
 *
 * This implements the battle-tested "break-glass" authentication pattern:
 * 1. Primary: DB-backed encrypted provider settings (normal operation)
 * 2. Secondary: Environment-backed emergency admin (recovery mode)
 *
 * Features:
 * - Automatic fallback when DB is unavailable
 * - TOTP 2FA support for enhanced security
 * - Comprehensive audit logging
 * - Recovery mode with limited capabilities
 * - Account lockout protection
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import {
  encryptProviderData,
  decryptProviderData,
  hashProviderPassword,
  verifyProviderPassword,
  verifyTOTP,
  secureCompare
} from './provider-encryption';

const prisma = new PrismaClient();

// Legacy interfaces for backward compatibility
export interface ProviderUser {
  id: string;
  email: string;
  role: 'OWNER';
  orgId: string;
  permissions: string[];
  lastLogin: Date;
  mfaEnabled: boolean;
}

export interface ProviderSession {
  user: ProviderUser;
  sessionId: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

export interface ProviderAuthResult {
  success: boolean;
  mode: 'normal' | 'recovery';
  user?: {
    id?: string;
    email: string;
    displayName?: string;
    permissions: string[];
  };
  error?: string;
  requiresTOTP?: boolean;
}

export interface ProviderLoginRequest {
  email: string;
  password: string;
  totpCode?: string;
  ipAddress?: string;
  userAgent?: string;
}



/**
 * Primary DB-backed provider authentication
 */
async function authenticateProviderDB(request: ProviderLoginRequest): Promise<ProviderAuthResult> {
  const { email, password, totpCode, ipAddress, userAgent } = request;

  try {
    // Find provider by email
    const provider = await prisma.providerSettings.findUnique({
      where: { email: encryptProviderData(email.toLowerCase()) }
    });

    if (!provider) {
      return {
        success: false,
        mode: 'normal',
        error: 'Invalid credentials'
      };
    }

    // Check if account is locked
    if (provider.lockedUntil && provider.lockedUntil > new Date()) {
      return {
        success: false,
        mode: 'normal',
        error: 'Account temporarily locked due to failed login attempts'
      };
    }

    // Check if account is active
    if (!provider.isActive) {
      return {
        success: false,
        mode: 'normal',
        error: 'Account is disabled'
      };
    }

    // Verify password
    const decryptedPasswordHash = decryptProviderData(provider.passwordHash);
    const passwordValid = await verifyProviderPassword(password, decryptedPasswordHash);

    if (!passwordValid) {
      // Increment failed login count
      await incrementFailedLogins(provider.id);

      return {
        success: false,
        mode: 'normal',
        error: 'Invalid credentials'
      };
    }

    // Check TOTP if enabled
    if (provider.totpSecret) {
      if (!totpCode) {
        return {
          success: false,
          mode: 'normal',
          requiresTOTP: true,
          error: 'TOTP code required'
        };
      }

      const decryptedTotpSecret = decryptProviderData(provider.totpSecret);
      const totpValid = verifyTOTP(totpCode, decryptedTotpSecret);

      if (!totpValid) {
        await incrementFailedLogins(provider.id);
        return {
          success: false,
          mode: 'normal',
          error: 'Invalid TOTP code'
        };
      }
    }

    // Success - update login tracking
    await prisma.providerSettings.update({
      where: { id: provider.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        failedLoginCount: 0,
        lockedUntil: null
      }
    });

    // Log successful login
    await logProviderAudit({
      providerId: provider.id,
      action: 'LOGIN',
      email,
      ipAddress,
      userAgent,
      isRecoveryMode: false
    });

    // Decrypt user data for response
    const decryptedEmail = decryptProviderData(provider.email);
    const decryptedDisplayName = provider.displayName ? decryptProviderData(provider.displayName) : undefined;
    const decryptedPermissions = provider.permissions.map((p: string) => decryptProviderData(p));

    return {
      success: true,
      mode: 'normal',
      user: {
        id: provider.id,
        email: decryptedEmail,
        displayName: decryptedDisplayName,
        permissions: decryptedPermissions
      }
    };

  } catch (error) {
    console.error('Provider DB authentication error:', error);
    throw new Error('Database authentication failed');
  }
}

/**
 * Break-glass environment-backed provider authentication
 */
async function authenticateProviderRecovery(request: ProviderLoginRequest): Promise<ProviderAuthResult> {
  const { email, password, totpCode, ipAddress, userAgent } = request;

  // Get break-glass credentials from environment
  const envEmail = process.env.PROVIDER_ADMIN_EMAIL;
  const envPasswordHash = process.env.PROVIDER_ADMIN_PASSWORD_HASH;
  const envTotpSecret = process.env.PROVIDER_ADMIN_TOTP_SECRET;

  if (!envEmail || !envPasswordHash) {
    return {
      success: false,
      mode: 'recovery',
      error: 'Recovery mode not configured'
    };
  }

  // Verify email
  if (!secureCompare(email.toLowerCase(), envEmail.toLowerCase())) {
    return {
      success: false,
      mode: 'recovery',
      error: 'Invalid recovery credentials'
    };
  }

  // Verify password
  const passwordValid = await verifyProviderPassword(password, envPasswordHash);
  if (!passwordValid) {
    return {
      success: false,
      mode: 'recovery',
      error: 'Invalid recovery credentials'
    };
  }

  // Verify TOTP if configured
  if (envTotpSecret) {
    if (!totpCode) {
      return {
        success: false,
        mode: 'recovery',
        requiresTOTP: true,
        error: 'TOTP code required for recovery access'
      };
    }

    const totpValid = verifyTOTP(totpCode, envTotpSecret);
    if (!totpValid) {
      return {
        success: false,
        mode: 'recovery',
        error: 'Invalid TOTP code'
      };
    }
  }

  return {
    success: true,
    mode: 'recovery',
    user: {
      email: envEmail,
      displayName: 'Recovery Admin',
      permissions: ['RECOVERY_MODE'] // Limited permissions in recovery
    }
  };
}

/**
 * Increment failed login attempts and lock account if necessary
 */
async function incrementFailedLogins(providerId: string): Promise<void> {
  try {
    const provider = await prisma.providerSettings.findUnique({
      where: { id: providerId },
      select: { failedLoginCount: true }
    });

    if (!provider) return;

    const newFailedCount = provider.failedLoginCount + 1;
    const lockUntil = newFailedCount >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 min lock

    await prisma.providerSettings.update({
      where: { id: providerId },
      data: {
        failedLoginCount: newFailedCount,
        lockedUntil: lockUntil
      }
    });
  } catch (error) {
    console.error('Failed to increment login attempts:', error);
  }
}

/**
 * Log provider audit events
 */
interface AuditLogData {
  providerId?: string;
  action: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  isRecoveryMode: boolean;
  details?: any;
}

async function logProviderAudit(data: AuditLogData): Promise<void> {
  try {
    // If we don't have a providerId (recovery mode), try to find it
    if (!data.providerId && data.email && !data.isRecoveryMode) {
      const provider = await prisma.providerSettings.findUnique({
        where: { email: encryptProviderData(data.email.toLowerCase()) },
        select: { id: true }
      });
      data.providerId = provider?.id;
    }

    // Only log to DB if we have a provider ID (normal mode)
    if (data.providerId) {
      await prisma.providerAuditLog.create({
        data: {
          providerId: data.providerId,
          action: data.action,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          isRecoveryMode: data.isRecoveryMode
        }
      });
    }

    // Always log to console for monitoring
    console.log(`🔍 PROVIDER AUDIT: ${data.action} | ${data.email} | Recovery: ${data.isRecoveryMode}`);
  } catch (error) {
    console.error('Failed to log provider audit:', error);
  }
}

/**
 * Legacy authentication function for backward compatibility
 * @deprecated Use authenticateProvider(ProviderLoginRequest) instead
 */
export async function authenticateProvider(req: NextApiRequest): Promise<ProviderUser | null>;
export async function authenticateProvider(request: ProviderLoginRequest): Promise<ProviderAuthResult>;
export async function authenticateProvider(reqOrRequest: NextApiRequest | ProviderLoginRequest): Promise<ProviderUser | ProviderAuthResult | null> {
  // Handle legacy NextApiRequest format
  if ('headers' in reqOrRequest && 'cookies' in reqOrRequest) {
    const req = reqOrRequest as NextApiRequest;

    // Try to get provider email from cookie
    const providerCookieEmail = req.cookies.ws_provider;
    if (!providerCookieEmail) {
      return null;
    }

    // For legacy compatibility, return a ProviderUser object
    return {
      id: 'provider-system',
      email: decodeURIComponent(providerCookieEmail),
      role: 'OWNER' as const,
      orgId: 'provider-system',
      permissions: getProviderPermissions(),
      lastLogin: new Date(),
      mfaEnabled: false,
    };
  }

  // Handle new ProviderLoginRequest format
  return authenticateProviderNew(reqOrRequest as ProviderLoginRequest);
}

/**
 * New authentication function with dual-layer support
 */
async function authenticateProviderNew(request: ProviderLoginRequest): Promise<ProviderAuthResult> {
  const { email, password, totpCode, ipAddress, userAgent } = request;

  console.log(`🏢 PROVIDER AUTH ATTEMPT: ${email} (IP: ${ipAddress})`);

  // Step 1: Try primary DB-backed authentication
  try {
    const dbResult = await authenticateProviderDB(request);
    if (dbResult.success) {
      console.log(`✅ PROVIDER DB AUTH SUCCESS: ${email} (mode: normal)`);
      return dbResult;
    }

    // If DB auth failed but DB is healthy, don't fall back to recovery
    if (dbResult.error && !dbResult.error.includes('database')) {
      return dbResult;
    }
  } catch (error) {
    console.warn(`⚠️ PROVIDER DB AUTH ERROR: ${error} - Falling back to recovery mode`);
  }

  // Step 2: Fallback to break-glass environment authentication
  try {
    const recoveryResult = await authenticateProviderRecovery(request);
    if (recoveryResult.success) {
      console.log(`🚨 PROVIDER RECOVERY AUTH SUCCESS: ${email} (mode: recovery)`);

      // Log recovery mode access
      await logProviderAudit({
        action: 'RECOVERY_LOGIN',
        email,
        ipAddress,
        userAgent,
        isRecoveryMode: true,
        details: { reason: 'Database unavailable or unhealthy' }
      });

      return recoveryResult;
    }

    return recoveryResult;
  } catch (error) {
    console.error(`❌ PROVIDER RECOVERY AUTH ERROR: ${error}`);
    return {
      success: false,
      mode: 'recovery',
      error: 'Authentication failed - both primary and recovery systems unavailable'
    };
  }
}

/**
 * Middleware to protect provider-only routes
 */
export function requireProviderAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: ProviderUser) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await authenticateProvider(req);

    if (!user) {
      return res.status(401).json({
        error: 'Provider authentication required',
        code: 'PROVIDER_AUTH_REQUIRED'
      });
    }

    // Add user to request for handler
    (req as any).providerUser = user;

    return handler(req, res, user);
  };
}

/**
 * Get provider-specific permissions (environment-based, not user-based)
 */
function getProviderPermissions(): string[] {
  // Provider permissions are system-level, not user-specific
  return [
    'provider:read',
    'provider:dashboard',
    'provider:clients:read',
    'provider:clients:write',
    'provider:revenue:read',
    'provider:analytics:read',
    'provider:admin',
    'provider:billing:write',
    'provider:settings:write',
    'provider:federation:admin',
    'provider:system:monitor',
    'provider:cross-client:analytics',
    'provider:monetization:manage',
  ];
}

/**
 * Log provider access for audit trail
 */
async function logProviderAccess(userId: string, req: NextApiRequest) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: 'SYSTEM', // Provider actions are system-level
        actorId: userId,
        action: 'PROVIDER_ACCESS',
        entityType: 'provider_system',
        delta: {
          endpoint: req.url,
          method: req.method,
          userAgent: req.headers['user-agent'],
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to log provider access:', error);
  }
}

/**
 * Check if user has specific provider permission
 */
export function hasProviderPermission(user: ProviderUser, permission: string): boolean {
  return user.permissions.includes(permission) || user.permissions.includes('provider:admin');
}

/**
 * Provider session management
 */
export class ProviderSessionManager {
  private static sessions = new Map<string, ProviderSession>();

  static async createSession(user: ProviderUser, req: NextApiRequest): Promise<string> {
    const sessionId = generateSessionId();
    const session: ProviderSession = {
      user,
      sessionId,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    };

    this.sessions.set(sessionId, session);
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    return sessionId;
  }

  static getSession(sessionId: string): ProviderSession | null {
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

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Provider audit logging
 */
export async function logProviderAction(
  userId: string,
  action: string,
  resource: string,
  details: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: 'SYSTEM', // Provider actions are system-level
        actorId: userId,
        action: `PROVIDER_${action}`,
        entityType: resource,
        delta: details,
      },
    });
  } catch (error) {
    console.error('Failed to log provider action:', error);
  }
}

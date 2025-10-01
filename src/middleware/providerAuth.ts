// src/middleware/providerAuth.ts
// Provider authentication middleware using environment-based credentials
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// ===== PROVIDER AUTH TYPES =====

export interface ProviderAuthResult {
  authenticated: boolean;
  email?: string;
  mode?: 'normal' | 'recovery';
  error?: string;
}

// ===== PROVIDER AUTH FUNCTIONS =====

/**
 * Verify provider credentials from environment variables
 * Supports both normal mode (DB-backed) and recovery mode (env-backed)
 */
export async function verifyProviderAuth(
  email: string,
  password: string,
  totpCode?: string
): Promise<ProviderAuthResult> {
  // Try normal mode first (DB-backed provider settings)
  try {
    const settings = await prisma.providerSettings.findUnique({
      where: { email },
    });

    if (settings) {
      // Verify password hash
      const passwordMatch = await verifyPasswordHash(password, settings.passwordHash);
      
      if (passwordMatch) {
        // Verify TOTP if enabled
        if (settings.totpSecret && totpCode) {
          const totpValid = verifyTOTP(totpCode, settings.totpSecret);
          if (!totpValid) {
            return { authenticated: false, error: 'Invalid TOTP code' };
          }
        }

        // Audit log
        await prisma.auditLog.create({
          data: {
            orgId: 'PROVIDER',
            actorId: email,
            action: 'provider.login',
            entityType: 'provider',
            entityId: email,
            delta: { mode: 'normal' },
          },
        });

        return { authenticated: true, email, mode: 'normal' };
      }
    }
  } catch (error) {
    console.error('Provider DB auth failed, falling back to recovery mode:', error);
  }

  // Fallback to recovery mode (env-backed emergency admin)
  const envEmail = process.env.PROVIDER_ADMIN_EMAIL;
  const envHash = process.env.PROVIDER_ADMIN_PASSWORD_HASH;
  const envTotp = process.env.PROVIDER_ADMIN_TOTP_SECRET;

  if (!envEmail || !envHash) {
    return { authenticated: false, error: 'Provider auth not configured' };
  }

  if (email === envEmail) {
    const passwordMatch = await verifyPasswordHash(password, envHash);
    
    if (passwordMatch) {
      // TOTP is REQUIRED for recovery mode
      if (!envTotp || !totpCode) {
        return { authenticated: false, error: 'TOTP required for recovery mode' };
      }

      const totpValid = verifyTOTP(totpCode, envTotp);
      if (!totpValid) {
        return { authenticated: false, error: 'Invalid TOTP code' };
      }

      // Audit log (recovery mode)
      try {
        await prisma.auditLog.create({
          data: {
            orgId: 'PROVIDER',
            actorId: email,
            action: 'provider.login_recovery',
            entityType: 'provider',
            entityId: email,
            delta: { mode: 'recovery', warning: 'Database unavailable' },
          },
        });
      } catch (error) {
        console.error('Failed to log recovery mode login:', error);
      }

      return { authenticated: true, email, mode: 'recovery' };
    }
  }

  return { authenticated: false, error: 'Invalid credentials' };
}

/**
 * Verify password hash (bcrypt/argon2)
 */
async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  // TODO: Implement actual bcrypt/argon2 verification
  // For now, simple comparison (INSECURE - replace with bcrypt.compare)
  return password === hash;
}

/**
 * Verify TOTP code
 */
function verifyTOTP(code: string, secret: string): boolean {
  // TODO: Implement actual TOTP verification (use speakeasy or similar)
  // For now, simple check (INSECURE - replace with real TOTP)
  return code.length === 6 && /^\d{6}$/.test(code);
}

/**
 * Verify HMAC signature for provider API calls
 */
export function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get provider email from request (cookie-based)
 */
export function getProviderEmailFromReq(req: NextApiRequest): string | null {
  // Check for provider session cookie
  const providerSession = req.cookies.ws_provider;
  if (!providerSession) return null;

  try {
    // TODO: Implement proper JWT verification
    // For now, simple base64 decode (INSECURE - replace with JWT)
    const decoded = Buffer.from(providerSession, 'base64').toString('utf-8');
    const session = JSON.parse(decoded);
    return session.email || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if provider is in recovery mode
 */
export function isRecoveryMode(req: NextApiRequest): boolean {
  const providerSession = req.cookies.ws_provider;
  if (!providerSession) return false;

  try {
    const decoded = Buffer.from(providerSession, 'base64').toString('utf-8');
    const session = JSON.parse(decoded);
    return session.mode === 'recovery';
  } catch (error) {
    return false;
  }
}

/**
 * Middleware to protect provider-only endpoints
 */
export function withProviderAuth(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const providerEmail = getProviderEmailFromReq(req);

    if (!providerEmail) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Provider authentication required',
      });
      return;
    }

    // Check if in recovery mode
    const recoveryMode = isRecoveryMode(req);

    if (recoveryMode) {
      // Add recovery mode banner to response
      res.setHeader('X-Recovery-Mode', 'true');
      res.setHeader('X-Recovery-Warning', 'Database unavailable - limited operations');
    }

    // Audit log provider API access
    try {
      await prisma.auditLog.create({
        data: {
          orgId: 'PROVIDER',
          actorId: providerEmail,
          action: 'provider.api_access',
          entityType: 'provider',
          entityId: req.url || 'unknown',
          delta: {
            method: req.method,
            path: req.url,
            recoveryMode,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log provider API access:', error);
    }

    // Call the actual handler
    await handler(req, res);
  };
}

/**
 * Rate limit provider requests (stricter than tenant requests)
 */
export function providerRateLimit(req: NextApiRequest): boolean {
  // TODO: Implement proper rate limiting
  // For now, always allow (INSECURE - replace with real rate limiting)
  return true;
}

/**
 * Create provider session cookie
 */
export function createProviderSession(email: string, mode: 'normal' | 'recovery'): string {
  // TODO: Implement proper JWT signing
  // For now, simple base64 encode (INSECURE - replace with JWT)
  const session = { email, mode, createdAt: Date.now() };
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

/**
 * Set provider session cookie
 */
export function setProviderSessionCookie(
  res: NextApiResponse,
  email: string,
  mode: 'normal' | 'recovery'
) {
  const session = createProviderSession(email, mode);
  
  // Set cookie with secure options
  res.setHeader('Set-Cookie', [
    `ws_provider=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${mode === 'recovery' ? 3600 : 86400}`,
  ]);
}

/**
 * Clear provider session cookie
 */
export function clearProviderSessionCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', [
    'ws_provider=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
  ]);
}


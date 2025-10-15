/**
 * @cortiware/auth-service
 * Shared authentication utilities for Cortiware monorepo
 */

// Export types
export type {
  AccountType,
  AuthError,
  AuthResult,
  AuthInput,
  ProviderAuthConfig,
  DeveloperAuthConfig,
  DatabaseUser,
  TicketPayload,
  TicketResult,
  CookieOptions,
} from './types';

// Export authentication functions
export {
  authenticateProvider,
  authenticateDeveloper,
  authenticateDatabaseUser,
  authenticateEmergency,
} from './authenticate';

// Export TOTP utilities
export {
  verifyTOTPCode,
  verifyBackupCode,
  generateTOTPSecret,
  generateBackupCodes,
} from './totp';

// Export cookie utilities
export {
  buildCookieHeader,
  getCookieName,
  getRedirectPath,
} from './cookie';

// Export ticket utilities
export {
  issueAuthTicket,
  verifyAuthTicket,
  cleanupExpiredNonces,
} from './ticket';

// Export refresh token utilities
export type {
  RefreshTokenPayload,
  AccessTokenPayload,
} from './refresh-token';

export {
  generateRefreshToken,
  generateAccessToken,
  verifyRefreshToken,
  verifyAccessToken,
  generateSessionId,
} from './refresh-token';

// Export auth context utilities
export type {
  AuthMode,
  AuthRole,
  AuthContext,
  GetAuthContextOptions,
} from './context';

export {
  getAuthContext,
  isDirectAccessMode,
  requireAuth,
  requireRole,
} from './context';

// Export session extraction utilities
export type {
  ProviderSession,
  DeveloperSession,
  TenantSession,
} from './session';

export {
  getProviderSession,
  getDeveloperSession,
  getTenantSession,
  getAccountantSession,
  getVendorSession,
} from './session';


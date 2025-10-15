/**
 * @cortiware/auth-service
 * Shared authentication utilities for Cortiware monorepo
 */
export type { AccountType, AuthError, AuthResult, AuthInput, ProviderAuthConfig, DeveloperAuthConfig, DatabaseUser, TicketPayload, TicketResult, CookieOptions, } from './types';
export { authenticateProvider, authenticateDeveloper, authenticateDatabaseUser, authenticateEmergency, } from './authenticate';
export { verifyTOTPCode, verifyBackupCode, generateTOTPSecret, generateBackupCodes, } from './totp';
export { buildCookieHeader, getCookieName, getRedirectPath, } from './cookie';
export { issueAuthTicket, verifyAuthTicket, cleanupExpiredNonces, } from './ticket';
export type { RefreshTokenPayload, AccessTokenPayload, } from './refresh-token';
export { generateRefreshToken, generateAccessToken, verifyRefreshToken, verifyAccessToken, generateSessionId, } from './refresh-token';
export type { AuthMode, AuthRole, AuthContext, GetAuthContextOptions, } from './context';
export { getAuthContext, isDirectAccessMode, requireAuth, requireRole, } from './context';
export type { ProviderSession, DeveloperSession, TenantSession, } from './session';
export { getProviderSession, getDeveloperSession, getTenantSession, getAccountantSession, getVendorSession, } from './session';
//# sourceMappingURL=index.d.ts.map
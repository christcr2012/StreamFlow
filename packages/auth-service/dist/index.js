/**
 * @cortiware/auth-service
 * Shared authentication utilities for Cortiware monorepo
 */
// Export authentication functions
export { authenticateProvider, authenticateDeveloper, authenticateDatabaseUser, authenticateEmergency, } from './authenticate';
// Export TOTP utilities
export { verifyTOTPCode, verifyBackupCode, generateTOTPSecret, generateBackupCodes, } from './totp';
// Export cookie utilities
export { buildCookieHeader, getCookieName, getRedirectPath, } from './cookie';
// Export ticket utilities
export { issueAuthTicket, verifyAuthTicket, cleanupExpiredNonces, } from './ticket';
export { generateRefreshToken, generateAccessToken, verifyRefreshToken, verifyAccessToken, generateSessionId, } from './refresh-token';
export { getAuthContext, isDirectAccessMode, requireAuth, requireRole, } from './context';
export { getProviderSession, getDeveloperSession, getTenantSession, getAccountantSession, getVendorSession, } from './session';

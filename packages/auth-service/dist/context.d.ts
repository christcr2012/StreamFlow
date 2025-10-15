/**
 * Authentication Context Utilities
 *
 * Provides unified auth context extraction for both tenant-app and provider-portal.
 * Supports multiple authentication modes:
 * - Normal mode: User authenticated via SSO or direct login
 * - Direct Access mode: Provider/Developer authenticated via emergency endpoint
 */
export type AuthMode = 'normal' | 'direct-access';
export type AuthRole = 'provider' | 'developer' | 'tenant' | 'accountant' | 'vendor' | null;
export interface AuthContext {
    mode: AuthMode;
    role: AuthRole;
    email: string | null;
    isAuthenticated: boolean;
    isDirectAccess: boolean;
    userId?: string;
    orgId?: string;
    providerId?: string;
    developerId?: string;
}
export interface GetAuthContextOptions {
    /**
     * Prisma client for database lookups (optional)
     * If provided, will fetch userId and orgId from database
     */
    prisma?: {
        user: {
            findUnique: (args: any) => Promise<{
                id: string;
                orgId: string;
            } | null>;
        };
    };
}
/**
 * Get current authentication context from cookies
 *
 * @param options - Optional configuration including Prisma client for DB lookups
 * @returns Authentication context with user info
 */
export declare function getAuthContext(options?: GetAuthContextOptions): Promise<AuthContext>;
/**
 * Check if current user is in direct access mode
 *
 * @param options - Optional configuration including Prisma client
 * @returns True if provider or developer is authenticated
 */
export declare function isDirectAccessMode(options?: GetAuthContextOptions): Promise<boolean>;
/**
 * Require authentication - throw error if not authenticated
 *
 * @param options - Optional configuration including Prisma client
 * @returns Authentication context
 * @throws Error if not authenticated
 */
export declare function requireAuth(options?: GetAuthContextOptions): Promise<AuthContext>;
/**
 * Require specific role - throw error if not authorized
 *
 * @param allowedRoles - Array of allowed roles
 * @param options - Optional configuration including Prisma client
 * @returns Authentication context
 * @throws Error if not authenticated or insufficient permissions
 */
export declare function requireRole(allowedRoles: AuthRole[], options?: GetAuthContextOptions): Promise<AuthContext>;
//# sourceMappingURL=context.d.ts.map
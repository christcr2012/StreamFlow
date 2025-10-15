/**
 * Authentication Context Utilities
 *
 * Provides unified auth context extraction for both tenant-app and provider-portal.
 * Supports multiple authentication modes:
 * - Normal mode: User authenticated via SSO or direct login
 * - Direct Access mode: Provider/Developer authenticated via emergency endpoint
 */
import { cookies } from 'next/headers';
/**
 * Get current authentication context from cookies
 *
 * @param options - Optional configuration including Prisma client for DB lookups
 * @returns Authentication context with user info
 */
export async function getAuthContext(options) {
    const cookieStore = await cookies();
    // Check for provider/developer cookies (direct access mode)
    const providerCookie = cookieStore.get('rs_provider');
    const developerCookie = cookieStore.get('rs_developer');
    if (providerCookie) {
        return {
            mode: 'direct-access',
            role: 'provider',
            email: providerCookie.value,
            isAuthenticated: true,
            isDirectAccess: true,
            providerId: providerCookie.value,
        };
    }
    if (developerCookie) {
        return {
            mode: 'direct-access',
            role: 'developer',
            email: developerCookie.value,
            isAuthenticated: true,
            isDirectAccess: true,
            developerId: developerCookie.value,
        };
    }
    // Check for normal user cookies
    const userCookie = cookieStore.get('rs_user');
    const accountantCookie = cookieStore.get('rs_accountant');
    const vendorCookie = cookieStore.get('rs_vendor');
    if (userCookie) {
        const email = userCookie.value;
        let userId;
        let orgId;
        // Fetch user from database if Prisma client provided
        if (options?.prisma) {
            const user = await options.prisma.user.findUnique({
                where: { email: email.toLowerCase() },
                select: { id: true, orgId: true },
            });
            userId = user?.id;
            orgId = user?.orgId;
        }
        return {
            mode: 'normal',
            role: 'tenant',
            email,
            isAuthenticated: true,
            isDirectAccess: false,
            userId,
            orgId,
        };
    }
    if (accountantCookie) {
        const email = accountantCookie.value;
        let userId;
        let orgId;
        // Fetch accountant from database if Prisma client provided
        if (options?.prisma) {
            const user = await options.prisma.user.findUnique({
                where: { email: email.toLowerCase() },
                select: { id: true, orgId: true },
            });
            userId = user?.id;
            orgId = user?.orgId;
        }
        return {
            mode: 'normal',
            role: 'accountant',
            email,
            isAuthenticated: true,
            isDirectAccess: false,
            userId,
            orgId,
        };
    }
    if (vendorCookie) {
        const email = vendorCookie.value;
        let userId;
        let orgId;
        // Fetch vendor from database if Prisma client provided
        if (options?.prisma) {
            const user = await options.prisma.user.findUnique({
                where: { email: email.toLowerCase() },
                select: { id: true, orgId: true },
            });
            userId = user?.id;
            orgId = user?.orgId;
        }
        return {
            mode: 'normal',
            role: 'vendor',
            email,
            isAuthenticated: true,
            isDirectAccess: false,
            userId,
            orgId,
        };
    }
    // Not authenticated
    return {
        mode: 'normal',
        role: null,
        email: null,
        isAuthenticated: false,
        isDirectAccess: false,
    };
}
/**
 * Check if current user is in direct access mode
 *
 * @param options - Optional configuration including Prisma client
 * @returns True if provider or developer is authenticated
 */
export async function isDirectAccessMode(options) {
    const context = await getAuthContext(options);
    return context.isDirectAccess;
}
/**
 * Require authentication - throw error if not authenticated
 *
 * @param options - Optional configuration including Prisma client
 * @returns Authentication context
 * @throws Error if not authenticated
 */
export async function requireAuth(options) {
    const context = await getAuthContext(options);
    if (!context.isAuthenticated) {
        throw new Error('Authentication required');
    }
    return context;
}
/**
 * Require specific role - throw error if not authorized
 *
 * @param allowedRoles - Array of allowed roles
 * @param options - Optional configuration including Prisma client
 * @returns Authentication context
 * @throws Error if not authenticated or insufficient permissions
 */
export async function requireRole(allowedRoles, options) {
    const context = await requireAuth(options);
    if (!allowedRoles.includes(context.role)) {
        throw new Error('Insufficient permissions');
    }
    return context;
}

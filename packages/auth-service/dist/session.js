/**
 * Session Extraction Utilities
 *
 * Provides unified session extraction from NextRequest for both apps.
 * Supports provider, developer, and tenant sessions.
 */
/**
 * Extract provider session from request cookies
 *
 * @param request - NextRequest object
 * @returns Provider session or null if not authenticated
 */
export function getProviderSession(request) {
    const cookies = request.cookies;
    // Check for provider session cookies (support legacy cookie names)
    const providerCookie = cookies.get('rs_provider') ||
        cookies.get('ws_provider') ||
        cookies.get('provider-session');
    if (providerCookie) {
        try {
            const email = decodeURIComponent(providerCookie.value);
            // TODO: In production, decode JWT to get role and providerId
            // For now, assume provider_admin for any authenticated provider
            return {
                email,
                role: 'provider_admin',
                providerId: undefined
            };
        }
        catch {
            return null;
        }
    }
    return null;
}
/**
 * Extract developer session from request cookies
 *
 * @param request - NextRequest object
 * @returns Developer session or null if not authenticated
 */
export function getDeveloperSession(request) {
    const cookies = request.cookies;
    // Check for developer session cookies (support legacy cookie names)
    const developerCookie = cookies.get('rs_developer') ||
        cookies.get('ws_developer') ||
        cookies.get('developer-session');
    if (developerCookie) {
        try {
            const email = decodeURIComponent(developerCookie.value);
            return {
                email,
                developerId: undefined
            };
        }
        catch {
            return null;
        }
    }
    return null;
}
/**
 * Extract tenant session from request cookies
 *
 * @param request - NextRequest object
 * @returns Tenant session or null if not authenticated
 */
export function getTenantSession(request) {
    const cookies = request.cookies;
    // Check for tenant session cookies (support legacy cookie names)
    const tenantCookie = cookies.get('rs_user') ||
        cookies.get('mv_user');
    if (tenantCookie) {
        try {
            const email = decodeURIComponent(tenantCookie.value);
            // TODO: In production, decode JWT to get userId and orgId
            return {
                email,
                userId: undefined,
                orgId: undefined
            };
        }
        catch {
            return null;
        }
    }
    return null;
}
/**
 * Extract accountant session from request cookies
 *
 * @param request - NextRequest object
 * @returns Tenant session (accountant is a type of tenant user) or null
 */
export function getAccountantSession(request) {
    const cookies = request.cookies;
    // Check for accountant session cookies (support legacy cookie names)
    const accountantCookie = cookies.get('rs_accountant') ||
        cookies.get('ws_accountant') ||
        cookies.get('accountant-session');
    if (accountantCookie) {
        try {
            const email = decodeURIComponent(accountantCookie.value);
            return {
                email,
                userId: undefined,
                orgId: undefined
            };
        }
        catch {
            return null;
        }
    }
    return null;
}
/**
 * Extract vendor session from request cookies
 *
 * @param request - NextRequest object
 * @returns Tenant session (vendor is a type of tenant user) or null
 */
export function getVendorSession(request) {
    const cookies = request.cookies;
    // Check for vendor session cookies (support legacy cookie names)
    const vendorCookie = cookies.get('rs_vendor') ||
        cookies.get('ws_vendor') ||
        cookies.get('vendor-session');
    if (vendorCookie) {
        try {
            const email = decodeURIComponent(vendorCookie.value);
            return {
                email,
                userId: undefined,
                orgId: undefined
            };
        }
        catch {
            return null;
        }
    }
    return null;
}

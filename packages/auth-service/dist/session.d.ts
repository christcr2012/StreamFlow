/**
 * Session Extraction Utilities
 *
 * Provides unified session extraction from NextRequest for both apps.
 * Supports provider, developer, and tenant sessions.
 */
import { NextRequest } from 'next/server';
/**
 * Provider session extracted from request
 */
export interface ProviderSession {
    email: string;
    role?: string;
    providerId?: string;
}
/**
 * Developer session extracted from request
 */
export interface DeveloperSession {
    email: string;
    developerId?: string;
}
/**
 * Tenant session extracted from request
 */
export interface TenantSession {
    email: string;
    userId?: string;
    orgId?: string;
}
/**
 * Extract provider session from request cookies
 *
 * @param request - NextRequest object
 * @returns Provider session or null if not authenticated
 */
export declare function getProviderSession(request: NextRequest): ProviderSession | null;
/**
 * Extract developer session from request cookies
 *
 * @param request - NextRequest object
 * @returns Developer session or null if not authenticated
 */
export declare function getDeveloperSession(request: NextRequest): DeveloperSession | null;
/**
 * Extract tenant session from request cookies
 *
 * @param request - NextRequest object
 * @returns Tenant session or null if not authenticated
 */
export declare function getTenantSession(request: NextRequest): TenantSession | null;
/**
 * Extract accountant session from request cookies
 *
 * @param request - NextRequest object
 * @returns Tenant session (accountant is a type of tenant user) or null
 */
export declare function getAccountantSession(request: NextRequest): TenantSession | null;
/**
 * Extract vendor session from request cookies
 *
 * @param request - NextRequest object
 * @returns Tenant session (vendor is a type of tenant user) or null
 */
export declare function getVendorSession(request: NextRequest): TenantSession | null;
//# sourceMappingURL=session.d.ts.map
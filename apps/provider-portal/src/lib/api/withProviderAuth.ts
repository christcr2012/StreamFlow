import { NextRequest, NextResponse } from 'next/server';
import type { ProviderRole } from '@/lib/rbac/roles';
import { hasPermission, type Permission } from '@/lib/rbac/roles';

/**
 * Provider session extracted from request
 */
export interface ProviderSession {
  email: string;
  role: ProviderRole;
  providerId?: string;
}

/**
 * Extract provider session from request cookies
 */
export function getProviderSession(request: NextRequest): ProviderSession | null {
  const cookies = request.cookies;
  
  // Check for provider session cookies
  const providerCookie = cookies.get('rs_provider') || cookies.get('ws_provider') || cookies.get('provider-session');
  
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
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Options for withProviderAuth middleware
 */
export interface WithProviderAuthOptions {
  /** Required role (defaults to any authenticated provider) */
  requiredRole?: ProviderRole;
  /** Required permission */
  requiredPermission?: Permission;
  /** Allow provider_admin to bypass permission checks */
  adminBypass?: boolean;
}

/**
 * Higher-order function to wrap API route handlers with provider authentication
 *
 * Usage:
 * ```typescript
 * // Non-dynamic route (no params)
 * export const GET = withProviderAuth(async (request, { session }) => {
 *   return NextResponse.json({ email: session.email });
 * });
 *
 * // Dynamic route (with params)
 * export const DELETE = withProviderAuth<Promise<{ id: string }>>(
 *   async (request, { params, session }) => {
 *     const { id } = await params;
 *     return NextResponse.json({ id });
 *   }
 * );
 * ```
 */
/**
 * Middleware wrapper for provider authentication
 * Supports both dynamic and non-dynamic routes
 *
 * Note: Next.js 15 type checking is disabled for this wrapper due to
 * incompatibility between dynamic and non-dynamic route signatures.
 * Runtime behavior is correct.
 */
export function withProviderAuth<TParams = any>(
  handler: (
    request: NextRequest,
    context: { params?: TParams; session: ProviderSession }
  ) => Promise<NextResponse> | NextResponse,
  options: WithProviderAuthOptions = {}
): any {
  return async (
    request: NextRequest,
    context?: { params?: TParams }
  ): Promise<NextResponse> => {
    // Extract session
    const session = getProviderSession(request);

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Provider authentication required' },
        { status: 401 }
      );
    }

    // Check role requirement
    if (options.requiredRole && session.role !== options.requiredRole) {
      // Allow admin bypass if enabled
      if (!(options.adminBypass && session.role === 'provider_admin')) {
        return NextResponse.json(
          { error: `Forbidden: ${options.requiredRole} role required` },
          { status: 403 }
        );
      }
    }

    // Check permission requirement
    if (options.requiredPermission) {
      const hasRequiredPermission = hasPermission(session.role, options.requiredPermission);

      if (!hasRequiredPermission) {
        return NextResponse.json(
          { error: `Forbidden: ${options.requiredPermission} permission required` },
          { status: 403 }
        );
      }
    }

    // Call handler with session and params (if provided)
    return handler(request, { params: context?.params, session });
  };
}

/**
 * Require provider_admin role
 */
export function withProviderAdmin(
  handler: (
    request: NextRequest,
    context: { params?: any; session: ProviderSession }
  ) => Promise<NextResponse> | NextResponse
) {
  return withProviderAuth(handler, { requiredRole: 'provider_admin' });
}

/**
 * Require specific permission
 */
export function withPermission(
  permission: Permission,
  handler: (
    request: NextRequest,
    context: { params?: any; session: ProviderSession }
  ) => Promise<NextResponse> | NextResponse
) {
  return withProviderAuth(handler, { requiredPermission: permission, adminBypass: true });
}


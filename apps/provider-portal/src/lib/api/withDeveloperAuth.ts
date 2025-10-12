import { NextRequest, NextResponse } from 'next/server';
import { PERMISSIONS, DEVELOPER_ROLE, hasPermission, type Permission } from '@/lib/rbac/roles';

/**
 * Developer session extracted from request
 */
export interface DeveloperSession {
  email: string;
  developerId?: string;
}

/**
 * Extract developer session from request cookies
 */
export function getDeveloperSession(request: NextRequest): DeveloperSession | null {
  const cookies = request.cookies;
  
  // Check for developer session cookies
  const devCookie = cookies.get('rs_developer') || cookies.get('ws_developer') || cookies.get('developer-session');
  
  if (devCookie) {
    try {
      const email = decodeURIComponent(devCookie.value);
      // TODO: In production, decode JWT to get developerId
      return { 
        email,
        developerId: undefined 
      };
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Options for withDeveloperAuth
 */
export interface DeveloperAuthOptions {
  requiredPermission?: Permission;
}

/**
 * Higher-order function to wrap API route handlers with developer authentication
 *
 * Usage:
 * ```typescript
 * // Basic authentication
 * export const GET = withDeveloperAuth(async (request, { session }) => {
 *   // session is guaranteed to exist here
 *   return NextResponse.json({ email: session.email });
 * });
 *
 * // With permission check
 * export const POST = withDeveloperAuth(
 *   async (request, { session }) => {
 *     return NextResponse.json({ created: true });
 *   },
 *   { requiredPermission: PERMISSIONS.DEVELOPER_KEYS_CREATE }
 * );
 * ```
 */
export function withDeveloperAuth<TParams = Record<string, never>>(
  handler: (
    request: NextRequest,
    context: { params: TParams; session: DeveloperSession }
  ) => Promise<NextResponse> | NextResponse,
  options?: DeveloperAuthOptions
) {
  return async (
    request: NextRequest,
    context: { params: TParams }
  ): Promise<NextResponse> => {
    // Extract session
    const session = getDeveloperSession(request);

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Developer authentication required' },
        { status: 401 }
      );
    }

    // Check permission if required
    if (options?.requiredPermission) {
      const hasPerm = hasPermission(DEVELOPER_ROLE, options.requiredPermission);
      if (!hasPerm) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: `Developer role does not have permission '${options.requiredPermission}'`
          },
          { status: 403 }
        );
      }
    }

    // Call handler with session
    return handler(request, { params: context.params, session });
  };
}


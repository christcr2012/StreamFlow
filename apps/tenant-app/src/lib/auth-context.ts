/**
 * Authentication Context Helpers
 *
 * Detects and manages authentication context:
 * - Normal mode: User authenticated via SSO or direct login
 * - Direct Access mode: Provider/Developer authenticated via emergency endpoint
 */

import { cookies } from 'next/headers';
import { prisma } from './prisma';

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

/**
 * Get current authentication context from cookies
 */
export async function getAuthContext(): Promise<AuthContext> {
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
    // Fetch user from database to get orgId
    const user = await prisma.user.findUnique({
      where: { email: userCookie.value.toLowerCase() },
      select: { id: true, orgId: true },
    });

    return {
      mode: 'normal',
      role: 'tenant',
      email: userCookie.value,
      isAuthenticated: true,
      isDirectAccess: false,
      userId: user?.id,
      orgId: user?.orgId,
    };
  }

  if (accountantCookie) {
    // Fetch accountant from database to get orgId
    const user = await prisma.user.findUnique({
      where: { email: accountantCookie.value.toLowerCase() },
      select: { id: true, orgId: true },
    });

    return {
      mode: 'normal',
      role: 'accountant',
      email: accountantCookie.value,
      isAuthenticated: true,
      isDirectAccess: false,
      userId: user?.id,
      orgId: user?.orgId,
    };
  }

  if (vendorCookie) {
    // Fetch vendor from database to get orgId
    const user = await prisma.user.findUnique({
      where: { email: vendorCookie.value.toLowerCase() },
      select: { id: true, orgId: true },
    });

    return {
      mode: 'normal',
      role: 'vendor',
      email: vendorCookie.value,
      isAuthenticated: true,
      isDirectAccess: false,
      userId: user?.id,
      orgId: user?.orgId,
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
 */
export async function isDirectAccessMode(): Promise<boolean> {
  const context = await getAuthContext();
  return context.isDirectAccess;
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext();
  
  if (!context.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return context;
}

/**
 * Require specific role - throw error if not authorized
 */
export async function requireRole(allowedRoles: AuthRole[]): Promise<AuthContext> {
  const context = await requireAuth();
  
  if (!allowedRoles.includes(context.role)) {
    throw new Error('Insufficient permissions');
  }
  
  return context;
}


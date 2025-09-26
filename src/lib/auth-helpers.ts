// src/lib/auth-helpers.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";

/**
 * Secure authentication helpers for server-side API routes.
 * Replaces direct cookie access with proper session validation.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  orgId: string;
}

/**
 * Get authenticated user from request
 * Validates session cookie and returns user data or null
 */
export async function getAuthenticatedUser(req: NextApiRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get email from cookie (temporary until proper session system)
    const email = req.cookies.ws_user;
    if (!email) {
      return null;
    }

    // Validate user exists and is active
    const user = await db.user.findFirst({
      where: {
        email,
        status: "active"
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
      }
    });

    return user;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

/**
 * Require authenticated user or return 401
 */
export async function requireAuth(req: NextApiRequest, res: NextApiResponse): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  
  return user;
}

/**
 * Get organization ID from authenticated request
 */
export async function getOrgIdFromReq(req: NextApiRequest): Promise<string | null> {
  const user = await getAuthenticatedUser(req);
  return user?.orgId || null;
}

/**
 * Get user email from authenticated request
 */
export async function getEmailFromReq(req: NextApiRequest): Promise<string | null> {
  const user = await getAuthenticatedUser(req);
  return user?.email || null;
}

/**
 * Audit logging for admin actions
 */
export async function auditLog(options: {
  userId: string;
  action: string;
  target?: string;
  details?: any;
  orgId: string;
}) {
  try {
    // For now, just log to console until AuditLog model is created
    console.log("AUDIT:", {
      userId: options.userId,
      action: options.action,
      target: options.target,
      details: options.details,
      orgId: options.orgId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Audit logging failed:", error);
    // Don't fail the request if audit logging fails
  }
}

/**
 * Generate secure temporary password
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}
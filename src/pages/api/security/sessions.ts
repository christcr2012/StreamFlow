// src/pages/api/security/sessions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getEmailFromReq } from "@/lib/rbac";

interface SessionData {
  id: string;
  sessionId: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
  location: string | null;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
  isCurrent: boolean;
}

/**
 * Get user's active sessions or revoke sessions
 * GET - List all active sessions for the authenticated user
 * POST - Revoke specific session(s)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // SECURITY: Ensure user is authenticated
    const email = getEmailFromReq(req);
    if (!email) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    // Find user
    const user = await db.user.findFirst({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    if (req.method === "GET") {
      return await handleGetSessions(req, res, user.id);
    } else if (req.method === "POST") {
      return await handleRevokeSessions(req, res, user.id);
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }
  } catch (error) {
    console.error('Sessions API error:', error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

/**
 * Get all active sessions for user
 */
async function handleGetSessions(req: NextApiRequest, res: NextApiResponse, userId: string) {
  // @ts-ignore - UserSession model exists but TypeScript hasn't refreshed yet
  const sessions = await (db as any).userSession.findMany({
    where: { 
      userId,
      isActive: true,
      expiresAt: { gt: new Date() } // Only non-expired sessions
    },
    select: {
      id: true,
      sessionId: true,
      ipAddress: true,
      userAgent: true,
      deviceInfo: true,
      location: true,
      isActive: true,
      lastSeenAt: true,
      createdAt: true,
    },
    orderBy: { lastSeenAt: 'desc' },
  });

  // Get current session ID from cookie for marking current session
  const currentSessionId = req.cookies.ws_session_id;

  const sessionData: SessionData[] = sessions.map((session: any) => ({
    ...session,
    lastSeenAt: session.lastSeenAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    isCurrent: session.sessionId === currentSessionId,
  }));

  return res.status(200).json({
    ok: true,
    sessions: sessionData,
  });
}

/**
 * Revoke sessions
 * Body: { sessionId?: string, action?: 'revoke-others' }
 */
async function handleRevokeSessions(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { sessionId, action } = body;

  if (action === "revoke-others") {
    // Revoke all sessions except current
    const currentSessionId = req.cookies.ws_session_id;
    
    // @ts-ignore - UserSession model exists but TypeScript hasn't refreshed yet
    const result = await (db as any).userSession.updateMany({
      where: { 
        userId,
        sessionId: { not: currentSessionId },
        isActive: true
      },
      data: { 
        isActive: false,
      },
    });

    return res.status(200).json({
      ok: true,
      message: `Revoked ${result.count} other sessions`,
      revokedCount: result.count,
    });
  } else if (sessionId) {
    // Revoke specific session
    const currentSessionId = req.cookies.ws_session_id;
    
    // Prevent revoking current session
    if (sessionId === currentSessionId) {
      return res.status(400).json({ 
        ok: false, 
        error: "Cannot revoke current session. Use logout instead." 
      });
    }

    // @ts-ignore - UserSession model exists but TypeScript hasn't refreshed yet
    const result = await (db as any).userSession.updateMany({
      where: { 
        userId,
        sessionId,
        isActive: true
      },
      data: { 
        isActive: false,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        ok: false,
        error: "Session not found or already revoked",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Session revoked successfully",
    });
  } else {
    return res.status(400).json({
      ok: false,
      error: "Either sessionId or action=revoke-others required",
    });
  }
}
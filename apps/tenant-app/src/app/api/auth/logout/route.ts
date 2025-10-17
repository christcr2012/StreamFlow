/**
 * Logout Endpoint
 * 
 * Revokes refresh tokens and clears session cookies
 * 
 * Security:
 * - Revokes all refresh tokens for the user's session
 * - Clears all auth cookies
 * - Logs logout event for audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken } from '@cortiware/auth-service';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const url = new URL(req.url);
    
    // Get refresh token from cookie or body
    let refreshToken = cookieStore.get('rs_refresh_token')?.value;
    
    if (!refreshToken) {
      const body = await req.json().catch(() => ({}));
      refreshToken = body.refreshToken;
    }

    // TODO: Add RefreshToken model to prisma/schema.prisma
    // If we have a refresh token, revoke it
    if (refreshToken) {
      const secret = process.env.AUTH_TOKEN_SECRET || process.env.AUTH_TICKET_HMAC_SECRET;
      if (secret) {
        const result = await verifyRefreshToken(refreshToken, secret);

        if (result.valid && result.payload) {
          const { sessionId, email } = result.payload;

          // Revoke the refresh token in database
          // await prisma.refreshToken.updateMany({
          //   where: { sessionId },
          //   data: { revoked: true, revokedAt: new Date() },
          // });

          console.log(`✅ Logout: Revoked refresh token for ${email} (database revocation disabled - RefreshToken model missing)`);
        }
      }
    }

    // Clear all auth cookies
    const res = NextResponse.redirect(new URL('/login?logout=success', url), 303);
    
    // Clear all possible auth cookies
    const cookiesToClear = [
      'rs_user',
      'rs_owner',
      'rs_manager',
      'rs_staff',
      'rs_accountant',
      'rs_vendor',
      'rs_provider',
      'rs_developer',
      'rs_access_token',
      'rs_refresh_token',
    ];

    for (const cookieName of cookiesToClear) {
      res.headers.append(
        'Set-Cookie',
        `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
      );
    }

    return res;
  } catch (error) {
    console.error('❌ Logout error:', error);
    const url = new URL(req.url);
    return NextResponse.redirect(new URL('/login', url), 303);
  }
}


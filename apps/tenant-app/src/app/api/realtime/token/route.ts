/**
 * Ably Token Generation Endpoint
 * 
 * Generates Ably tokens for authenticated users with appropriate permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAblyToken } from '@cortiware/realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/realtime/token
 *
 * Generates an Ably token for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check when auth is implemented
    // For now, accept orgId and userId from request
    const { orgId, userId } = await request.json();

    if (!orgId || !userId) {
      return NextResponse.json(
        { error: 'orgId and userId are required' },
        { status: 400 }
      );
    }

    // Generate token with appropriate capabilities
    const tokenRequest = await generateAblyToken(
      orgId,
      userId,
      {
        // Allow subscribing to org-specific channels
        [`org:${orgId}:*`]: ['subscribe'],
        // Allow publishing to user-specific channels (for presence)
        [`org:${orgId}:user:${userId}`]: ['publish', 'subscribe'],
      }
    );

    return NextResponse.json({
      tokenRequest: JSON.parse(tokenRequest),
    });
  } catch (error) {
    console.error('Error generating Ably token:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


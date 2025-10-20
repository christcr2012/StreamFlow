/**
 * Ably Token Generation Endpoint
 * 
 * Generates Ably tokens for authenticated users with appropriate permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAblyToken } from '@cortiware/realtime';
import { getServerSession } from 'next-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/realtime/token
 * 
 * Generates an Ably token for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get org ID from request or session
    const { orgId } = await request.json();
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      );
    }
    
    // Generate token with appropriate capabilities
    const tokenRequest = await generateAblyToken(
      orgId,
      session.user.email,
      {
        // Allow subscribing to org-specific channels
        [`org:${orgId}:*`]: ['subscribe'],
        // Allow publishing to user-specific channels (for presence)
        [`org:${orgId}:user:${session.user.email}`]: ['publish', 'subscribe'],
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


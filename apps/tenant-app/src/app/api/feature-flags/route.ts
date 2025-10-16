/**
 * Feature Flags API
 * Returns feature flags for the authenticated organization
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: { featureFlags: true },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse feature flags from JSON
    const flags = typeof org.featureFlags === 'object' && org.featureFlags !== null
      ? org.featureFlags as Record<string, boolean>
      : {};

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}


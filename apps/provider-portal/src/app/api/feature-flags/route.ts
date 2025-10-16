/**
 * Feature Flags API (Provider Portal)
 * Returns global feature flags for the provider
 *
 * Feature flags are stored in the ProviderConfig table and can be
 * updated via the provider settings UI or API.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProviderSession } from '@/lib/api/withProviderAuth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/feature-flags
 * Returns provider-level feature flags from database
 */
export async function GET(request: NextRequest) {
  try {
    const session = getProviderSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load feature flags from database
    const config = await prisma.providerConfig.findFirst();

    // Parse feature flags from JSON field
    const flags = (config?.featureFlags as Record<string, boolean>) || {
      'analytics-v2': true,
      'action-center': true,
      'api-key-management': true,
      'advanced-monitoring': false,
      'multi-region': false,
    };

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feature-flags
 * Updates provider-level feature flags (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = getProviderSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow provider_admin role to update feature flags
    if (session.role !== 'provider_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { flags } = body;

    if (!flags || typeof flags !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request - flags object required' },
        { status: 400 }
      );
    }

    // Get or create provider config
    let config = await prisma.providerConfig.findFirst();

    if (!config) {
      // Create initial config if it doesn't exist
      config = await prisma.providerConfig.create({
        data: {
          featureFlags: flags,
        },
      });
    } else {
      // Update existing config
      config = await prisma.providerConfig.update({
        where: { id: config.id },
        data: {
          featureFlags: flags,
        },
      });
    }

    return NextResponse.json({
      success: true,
      flags: config.featureFlags,
    });
  } catch (error) {
    console.error('Error updating feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flags' },
      { status: 500 }
    );
  }
}


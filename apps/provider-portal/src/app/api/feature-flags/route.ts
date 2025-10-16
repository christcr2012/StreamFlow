/**
 * Feature Flags API (Provider Portal)
 * Returns global feature flags for the provider
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProviderSession } from '@/lib/api/withProviderAuth';

export async function GET(request: NextRequest) {
  try {
    const session = getProviderSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Provider-level feature flags (can be stored in env or database)
    const flags = {
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


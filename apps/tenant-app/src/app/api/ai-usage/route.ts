import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAiUsage } from '@/lib/aiMeter';

/**
 * GET /api/ai-usage
 * Get AI usage statistics for the authenticated tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_client') || jar.get('client-session') || jar.get('ws_client');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from session
    const orgId = session.value;

    // Fetch AI usage data
    const usage = await getAiUsage(orgId);

    return NextResponse.json({
      ok: true,
      usage,
    });
  } catch (error: any) {
    console.error('Error fetching AI usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI usage' },
      { status: 500 }
    );
  }
}


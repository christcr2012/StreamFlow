/**
 * Cost Alerts Usage Summary API
 * 
 * Get current usage summary for cost monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { getUsageSummary } from '@/lib/cost-alerts';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'DAILY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';

    // Validate period
    if (!['DAILY', 'WEEKLY', 'MONTHLY'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be DAILY, WEEKLY, or MONTHLY' },
        { status: 400 }
      );
    }

    const summary = await getUsageSummary(authContext.orgId, period);
    
    return NextResponse.json({ 
      ok: true, 
      summary: {
        ...summary,
        aiUsageDollars: summary.aiUsage / 100,
        smsUsageDollars: summary.smsUsage / 100,
        totalUsageDollars: summary.totalUsage / 100,
      }
    });
  } catch (error: any) {
    console.error('Error fetching usage summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage summary', details: error.message },
      { status: 500 }
    );
  }
}


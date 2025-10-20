/**
 * QA Scores Analytics API
 * 
 * Provides pre-computed QA metrics from materialized views
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Note: Cannot use edge runtime with Prisma due to WASM limitations
// export const runtime = 'edge';

/**
 * GET /api/analytics/qa-scores
 * 
 * Get QA scores and inspection metrics for the authenticated tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_client') || jar.get('client-session') || jar.get('ws_client');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.value;

    // Get query params
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; // day, week, month
    const contractId = searchParams.get('contractId');
    const limit = parseInt(searchParams.get('limit') || '30');

    // Query materialized view
    const query = `
      SELECT *
      FROM mv_qa_scores
      WHERE org_id = $1
      ${contractId ? 'AND contract_id = $2' : ''}
      ORDER BY ${period} DESC
      LIMIT $${contractId ? '3' : '2'}
    `;

    const params = contractId ? [orgId, contractId, limit] : [orgId, limit];
    
    const results = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json({
      ok: true,
      data: results,
      period,
      refreshedAt: (results as any[])[0]?.refreshed_at,
    });
  } catch (error: any) {
    console.error('Error fetching QA scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QA scores' },
      { status: 500 }
    );
  }
}


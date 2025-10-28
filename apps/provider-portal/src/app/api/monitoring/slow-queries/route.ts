/**
 * Slow Query Monitoring Endpoint
 * 
 * Provides access to slow query logs and performance analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSlowQueryHistory,
  getSlowQueryStats,
  analyzeQueryPerformance,
  clearSlowQueryHistory,
} from '@cortiware/db/middleware/slow-query-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/slow-queries
 * 
 * Returns slow query logs and statistics
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    if (action === 'analyze') {
      // Return performance analysis
      const analysis = analyzeQueryPerformance();
      return NextResponse.json(analysis);
    }
    
    if (action === 'stats') {
      // Return statistics only
      const stats = getSlowQueryStats();
      return NextResponse.json(stats);
    }
    
    // Return full history by default
    const history = getSlowQueryHistory();
    const stats = getSlowQueryStats();
    
    return NextResponse.json({
      history,
      stats,
      count: history.length,
    });
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monitoring/slow-queries
 * 
 * Clears slow query history
 */
export async function DELETE(request: NextRequest) {
  try {
    clearSlowQueryHistory();
    
    return NextResponse.json({
      success: true,
      message: 'Slow query history cleared',
    });
  } catch (error) {
    console.error('Error clearing slow queries:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


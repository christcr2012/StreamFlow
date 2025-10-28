/**
 * Database Health Check Endpoint
 * 
 * Provides detailed database health metrics including:
 * - Connection status
 * - Query latency
 * - Active connections
 * - Slow query detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth, getConnectionStats, prisma } from '@cortiware/db/connection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SlowQuery {
  query: string;
  duration_ms: number;
  state: string;
  wait_event: string | null;
}

/**
 * Get currently running slow queries
 */
async function getSlowQueries(thresholdMs: number = 1000): Promise<SlowQuery[]> {
  try {
    const result = await prisma.$queryRaw<SlowQuery[]>`
      SELECT 
        query,
        EXTRACT(EPOCH FROM (now() - query_start)) * 1000 as duration_ms,
        state,
        wait_event
      FROM pg_stat_activity
      WHERE state != 'idle'
        AND query NOT LIKE '%pg_stat_activity%'
        AND EXTRACT(EPOCH FROM (now() - query_start)) * 1000 > ${thresholdMs}
      ORDER BY duration_ms DESC
      LIMIT 10
    `;
    
    return result;
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    return [];
  }
}

/**
 * Get database size and table statistics
 */
async function getDatabaseStats() {
  try {
    const [dbSize, tableStats] = await Promise.all([
      prisma.$queryRaw<Array<{ size_mb: number }>>`
        SELECT pg_database_size(current_database()) / 1024 / 1024 as size_mb
      `,
      prisma.$queryRaw<Array<{ 
        table_name: string;
        row_count: bigint;
        total_size_mb: number;
      }>>`
        SELECT 
          schemaname || '.' || tablename as table_name,
          n_live_tup as row_count,
          pg_total_relation_size(schemaname || '.' || tablename) / 1024 / 1024 as total_size_mb
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
        LIMIT 10
      `,
    ]);
    
    return {
      database_size_mb: dbSize[0]?.size_mb || 0,
      largest_tables: tableStats.map((t: any) => ({
        table: t.table_name,
        rows: Number(t.row_count),
        size_mb: t.total_size_mb,
      })),
    };
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return {
      database_size_mb: 0,
      largest_tables: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET /api/health/db
 * 
 * Returns comprehensive database health information
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeSlowQueries = searchParams.get('slow_queries') === 'true';
  const includeStats = searchParams.get('stats') === 'true';
  
  try {
    // Basic health check
    const health = await checkDatabaseHealth();
    
    // Connection stats
    const connectionStats = await getConnectionStats();
    
    // Build response
    const response: any = {
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      latency_ms: health.latency,
      connection: {
        active: connectionStats.activeConnections,
        max: connectionStats.maxConnections,
        utilization: (connectionStats.activeConnections / connectionStats.maxConnections) * 100,
      },
    };
    
    // Add error if unhealthy
    if (!health.healthy) {
      response.error = health.error;
    }
    
    // Add slow queries if requested
    if (includeSlowQueries) {
      const slowQueries = await getSlowQueries();
      response.slow_queries = slowQueries;
      response.slow_query_count = slowQueries.length;
    }
    
    // Add database stats if requested
    if (includeStats) {
      const stats = await getDatabaseStats();
      response.database = stats;
    }
    
    // Determine HTTP status code
    const statusCode = health.healthy ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


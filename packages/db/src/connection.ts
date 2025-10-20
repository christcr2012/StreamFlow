/**
 * Neon Database Connection Configuration
 * 
 * Optimized for serverless environments with:
 * - HTTP/pooler endpoints
 * - Tiny connection pool sizes
 * - Keep-alive configuration
 * - Connection timeout handling
 */

import { PrismaClient } from '@prisma/client';

// Detect if we're in a serverless environment
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Connection pool configuration for serverless
const SERVERLESS_POOL_CONFIG = {
  connection_limit: 1, // Tiny pool for serverless (each function instance gets 1 connection)
  pool_timeout: 10, // 10 seconds
  connect_timeout: 10, // 10 seconds
  statement_timeout: 30000, // 30 seconds
};

// Connection pool configuration for local development
const LOCAL_POOL_CONFIG = {
  connection_limit: 10,
  pool_timeout: 20,
  connect_timeout: 10,
  statement_timeout: 60000,
};

/**
 * Ensure DATABASE_URL uses Neon's pooler endpoint
 * Pooler endpoints end with -pooler.{region}.aws.neon.tech
 */
function ensurePoolerEndpoint(url: string): string {
  if (!url) return url;
  
  // Check if already using pooler
  if (url.includes('-pooler.')) {
    return url;
  }
  
  // Convert direct endpoint to pooler endpoint
  // Example: ep-xxx.us-west-2.aws.neon.tech -> ep-xxx-pooler.us-west-2.aws.neon.tech
  const poolerUrl = url.replace(
    /(@ep-[^.]+)(\.[^.]+\.aws\.neon\.tech)/,
    '$1-pooler$2'
  );
  
  if (poolerUrl !== url) {
    console.warn('⚠️  Converting Neon direct endpoint to pooler endpoint');
    console.warn(`   Old: ${url.split('@')[1]?.split('/')[0]}`);
    console.warn(`   New: ${poolerUrl.split('@')[1]?.split('/')[0]}`);
  }
  
  return poolerUrl;
}

/**
 * Add connection parameters to DATABASE_URL
 */
function addConnectionParams(url: string, params: Record<string, string | number>): string {
  if (!url) return url;
  
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.set(key, String(value));
  });
  
  return urlObj.toString();
}

/**
 * Get optimized DATABASE_URL for current environment
 */
export function getOptimizedDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || '';
  
  // Ensure we're using pooler endpoint
  url = ensurePoolerEndpoint(url);
  
  // Add connection parameters based on environment
  const config = isServerless ? SERVERLESS_POOL_CONFIG : LOCAL_POOL_CONFIG;
  url = addConnectionParams(url, config);
  
  // Always require SSL
  if (!url.includes('sslmode=')) {
    url = addConnectionParams(url, { sslmode: 'require' });
  }
  
  return url;
}

/**
 * Prisma Client singleton with optimized configuration
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getOptimizedDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Register shutdown handlers
if (typeof process !== 'undefined') {
  process.on('beforeExit', disconnectDatabase);
  process.on('SIGINT', disconnectDatabase);
  process.on('SIGTERM', disconnectDatabase);
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - start;
    
    return {
      healthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get connection pool stats
 */
export async function getConnectionStats() {
  try {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    
    return {
      activeConnections: Number(result[0]?.count || 0),
      maxConnections: isServerless ? 1 : 10,
    };
  } catch (error) {
    return {
      activeConnections: 0,
      maxConnections: isServerless ? 1 : 10,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


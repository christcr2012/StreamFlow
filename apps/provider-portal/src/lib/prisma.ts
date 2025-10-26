// src/lib/prisma.ts
// Optimized for Neon + Vercel with pooled connections
import { PrismaClient } from "@prisma/client-provider";

// Detect if we're in a serverless environment
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Connection pool configuration
const SERVERLESS_POOL_CONFIG = {
  connection_limit: 1, // Tiny pool for serverless
  pool_timeout: 10,
  connect_timeout: 10,
  statement_timeout: 30000,
};

const LOCAL_POOL_CONFIG = {
  connection_limit: 10,
  pool_timeout: 30,
  connect_timeout: 30,
  statement_timeout: 60000,
};

/**
 * Ensure we're using Neon's pooler endpoint
 */
function ensurePoolerEndpoint(url: string): string {
  if (!url || url.includes('-pooler.')) return url;

  // Convert direct endpoint to pooler endpoint
  const poolerUrl = url.replace(
    /(@ep-[^.]+)(\.[^.]+\.aws\.neon\.tech)/,
    '$1-pooler$2'
  );

  return poolerUrl;
}

/**
 * Add connection parameters to URL
 */
function addConnectionParams(url: string, params: Record<string, any>): string {
  const urlObj = new URL(url);

  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.set(key, String(value));
  });

  return urlObj.toString();
}

/**
 * Get optimized DATABASE_URL for current environment
 */
function getOptimizedDatabaseUrl(): string {
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

declare global {
  // Allow global `var` redeclaration in dev
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: getOptimizedDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = Date.now();
          const result = await query(args);
          const duration = Date.now() - start;

          // Log queries that take longer than 1 second
          if (duration > 1000) {
            console.warn(`[slow-query] ${model}.${operation} took ${duration}ms`, {
              model,
              operation,
              duration,
            });
          }

          return result;
        },
      },
    },
  });
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
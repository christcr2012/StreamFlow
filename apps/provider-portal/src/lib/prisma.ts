// src/lib/prisma.ts
// Optimized for Neon + Vercel with pooled connections
import { PrismaClient } from "@prisma/client-provider";

// Detect if we're in a serverless environment
const isServerless =
  process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;

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
  if (!url || url.includes("-pooler.")) return url;

  // Convert direct endpoint to pooler endpoint
  const poolerUrl = url.replace(
    /(@ep-[^.]+)(\.[^.]+\.aws\.neon\.tech)/,
    "$1-pooler$2",
  );

  return poolerUrl;
}

/**
 * Add connection parameters to URL
 */
function addConnectionParams(url: string, params: Record<string, any>): string {
  // If URL is not set, return as-is to avoid build-time errors
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
function getOptimizedDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || "";

  // Ensure we're using pooler endpoint
  url = ensurePoolerEndpoint(url);

  // Add connection parameters based on environment (only if URL is present)
  if (url) {
    const config = isServerless ? SERVERLESS_POOL_CONFIG : LOCAL_POOL_CONFIG;
    url = addConnectionParams(url, config);
  }

  // Always require SSL
  if (url && !url.includes("sslmode=")) {
    url = addConnectionParams(url, { sslmode: "require" });
  }

  return url;
}

declare global {
  // Allow global `var` redeclaration in dev
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

function createPrismaClient() {
  const optimizedUrl = getOptimizedDatabaseUrl();
  const isBuildPhase =
    !process.env.DATABASE_URL ||
    process.env.NEXT_PHASE === "phase-production-build";

  const options: ConstructorParameters<typeof PrismaClient>[0] = {
    // Suppress error logs during build to reduce noise
    log: isBuildPhase
      ? []
      : process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  };

  // Only override datasources when URL is available; otherwise let Prisma use env at runtime
  if (optimizedUrl) {
    options.datasources = { db: { url: optimizedUrl } } as any;
  }

  return new PrismaClient(options).$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = Date.now();
          const result = await query(args);
          const duration = Date.now() - start;

          // Log queries that take longer than 1 second (skip during build)
          if (duration > 1000 && !isBuildPhase) {
            console.warn(
              `[slow-query] ${model}.${operation} took ${duration}ms`,
              {
                model,
                operation,
                duration,
              },
            );
          }

          return result;
        },
      },
    },
  });
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

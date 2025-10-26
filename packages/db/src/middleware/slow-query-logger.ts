/**
 * Prisma Client Extension for Slow Query Logging
 * 
 * Logs queries that exceed a configurable threshold to help identify
 * performance bottlenecks.
 * 
 * Updated to use Prisma Client Extensions (replaces deprecated middleware)
 */

export interface SlowQueryLog {
  timestamp: string;
  model: string;
  action: string;
  duration_ms: number;
  params: any;
}

// Configurable threshold (default: 1000ms)
const SLOW_QUERY_THRESHOLD_MS = parseInt(
  process.env.SLOW_QUERY_THRESHOLD_MS || '1000',
  10
);

// In-memory store for recent slow queries (last 100)
const slowQueryHistory: SlowQueryLog[] = [];
const MAX_HISTORY_SIZE = 100;

/**
 * Add slow query to history
 */
function addToHistory(log: SlowQueryLog) {
  slowQueryHistory.unshift(log);
  
  // Keep only last MAX_HISTORY_SIZE entries
  if (slowQueryHistory.length > MAX_HISTORY_SIZE) {
    slowQueryHistory.pop();
  }
}

/**
 * Get recent slow queries
 */
export function getSlowQueryHistory(): SlowQueryLog[] {
  return [...slowQueryHistory];
}

/**
 * Clear slow query history
 */
export function clearSlowQueryHistory() {
  slowQueryHistory.length = 0;
}

/**
 * Get slow query statistics
 */
export function getSlowQueryStats() {
  if (slowQueryHistory.length === 0) {
    return {
      count: 0,
      avg_duration_ms: 0,
      max_duration_ms: 0,
      min_duration_ms: 0,
      by_model: {},
      by_action: {},
    };
  }
  
  const durations = slowQueryHistory.map(q => q.duration_ms);
  const byModel: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  
  slowQueryHistory.forEach(q => {
    byModel[q.model] = (byModel[q.model] || 0) + 1;
    byAction[q.action] = (byAction[q.action] || 0) + 1;
  });
  
  return {
    count: slowQueryHistory.length,
    avg_duration_ms: durations.reduce((a, b) => a + b, 0) / durations.length,
    max_duration_ms: Math.max(...durations),
    min_duration_ms: Math.min(...durations),
    by_model: byModel,
    by_action: byAction,
  };
}

/**
 * Prisma Client Extension for slow query logging
 * Use this instead of the deprecated middleware
 * 
 * Example usage:
 * const prisma = new PrismaClient().$extends(slowQueryLoggerExtension())
 */
export function slowQueryLoggerExtension(thresholdMs: number = SLOW_QUERY_THRESHOLD_MS) {
  return {
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }: {
          operation: string;
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          const start = Date.now();

          try {
            const result = await query(args);
            const duration = Date.now() - start;

            // Log if query exceeded threshold
            if (duration > thresholdMs) {
              const log: SlowQueryLog = {
                timestamp: new Date().toISOString(),
                model: model || 'unknown',
                action: operation,
                duration_ms: duration,
                params: {
                  // Sanitize params to avoid logging sensitive data
                  where: args?.where ? '...' : undefined,
                  data: args?.data ? '...' : undefined,
                  select: args?.select ? Object.keys(args.select) : undefined,
                  include: args?.include ? Object.keys(args.include) : undefined,
                  take: args?.take,
                  skip: args?.skip,
                },
              };

              // Add to history
              addToHistory(log);

              // Log to console in development
              if (process.env.NODE_ENV === 'development') {
                console.warn(
                  `🐌 Slow query detected: ${log.model}.${log.action} took ${duration}ms`
                );
              }

              // In production, you might want to send to a monitoring service
              if (process.env.NODE_ENV === 'production') {
                // Example: Send to monitoring service
                // await sendToMonitoring(log);
              }
            }

            return result;
          } catch (error) {
            const duration = Date.now() - start;

            // Log failed queries that took a long time
            if (duration > thresholdMs) {
              const log: SlowQueryLog = {
                timestamp: new Date().toISOString(),
                model: model || 'unknown',
                action: operation,
                duration_ms: duration,
                params: {
                  error: error instanceof Error ? error.message : 'Unknown error',
                },
              };

              addToHistory(log);
            }

            throw error;
          }
        },
      },
    },
  };
}

/**
 * @deprecated Use slowQueryLoggerExtension() instead
 * Prisma middleware is deprecated in Prisma 5+
 */
export const slowQueryLoggerMiddleware = (params: any, next: any) => {
  console.warn('slowQueryLoggerMiddleware is deprecated. Use slowQueryLoggerExtension() instead.');
  return next(params);
};

/**
 * Query performance analyzer
 * 
 * Provides recommendations based on slow query patterns
 */
export function analyzeQueryPerformance() {
  const stats = getSlowQueryStats();
  const recommendations: string[] = [];
  
  if (stats.count === 0) {
    return {
      status: 'good',
      message: 'No slow queries detected',
      recommendations: [],
    };
  }
  
  // Check for high average duration
  if (stats.avg_duration_ms > 2000) {
    recommendations.push(
      'Average query duration is high. Consider adding database indexes or optimizing queries.'
    );
  }
  
  // Check for specific models with many slow queries
  Object.entries(stats.by_model).forEach(([model, count]) => {
    if (count > 10) {
      recommendations.push(
        `Model "${model}" has ${count} slow queries. Review indexes and query patterns.`
      );
    }
  });
  
  // Check for specific actions with many slow queries
  Object.entries(stats.by_action).forEach(([action, count]) => {
    if (count > 10) {
      recommendations.push(
        `Action "${action}" is frequently slow (${count} occurrences). Consider optimization.`
      );
    }
  });
  
  return {
    status: stats.avg_duration_ms > 3000 ? 'critical' : 'warning',
    message: `${stats.count} slow queries detected (avg: ${stats.avg_duration_ms.toFixed(0)}ms)`,
    recommendations,
    stats,
  };
}


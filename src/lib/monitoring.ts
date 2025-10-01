// src/lib/monitoring.ts
// Performance and error monitoring system
// TODO: Integrate with Sentry, Datadog, or similar service

// ===== METRICS TYPES =====

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

// ===== MONITORING SERVICE =====

export class MonitoringService {
  private metrics: Metric[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, unit: string = 'count', tags?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // TODO: Send to monitoring service (Datadog, Prometheus, etc.)
    console.log(`[METRIC] ${name}: ${value} ${unit}`, tags || '');
  }

  /**
   * Record performance metric
   */
  recordPerformance(metric: PerformanceMetric) {
    this.performanceMetrics.push(metric);

    // TODO: Send to APM service
    console.log(`[PERFORMANCE] ${metric.operation}: ${metric.duration}ms`, {
      success: metric.success,
      error: metric.error,
    });
  }

  /**
   * Report an error
   */
  reportError(error: Error, context: Record<string, any> = {}, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    const report: ErrorReport = {
      error,
      context,
      severity,
      timestamp: new Date(),
    };

    this.errors.push(report);

    // TODO: Send to error tracking service (Sentry, Rollbar, etc.)
    console.error(`[ERROR] ${severity.toUpperCase()}:`, error.message, {
      stack: error.stack,
      context,
    });
  }

  /**
   * Time an operation
   */
  async timeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      this.recordPerformance({
        operation,
        duration,
        success: true,
        metadata,
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - start;

      this.recordPerformance({
        operation,
        duration,
        success: false,
        error: error.message,
        metadata,
      });

      throw error;
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    return {
      totalMetrics: this.metrics.length,
      totalPerformanceMetrics: this.performanceMetrics.length,
      totalErrors: this.errors.length,
      recentMetrics: this.metrics.slice(-10),
      recentPerformance: this.performanceMetrics.slice(-10),
      recentErrors: this.errors.slice(-10),
    };
  }

  /**
   * Clear old metrics (cleanup)
   */
  clearOldMetrics(olderThanHours: number = 24) {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.errors = this.errors.filter(e => e.timestamp > cutoff);

    console.log(`Cleared metrics older than ${olderThanHours} hours`);
  }
}

// ===== SINGLETON INSTANCE =====

export const monitoring = new MonitoringService();

// ===== HELPER FUNCTIONS =====

/**
 * Record API call metric
 */
export function recordApiCall(method: string, path: string, statusCode: number, duration: number) {
  monitoring.recordMetric('api.call', 1, 'count', {
    method,
    path,
    status: statusCode.toString(),
  });

  monitoring.recordPerformance({
    operation: `${method} ${path}`,
    duration,
    success: statusCode < 400,
    metadata: { statusCode },
  });
}

/**
 * Record database query metric
 */
export function recordDbQuery(query: string, duration: number, success: boolean) {
  monitoring.recordMetric('db.query', 1, 'count', {
    success: success.toString(),
  });

  monitoring.recordPerformance({
    operation: 'db.query',
    duration,
    success,
    metadata: { query: query.substring(0, 100) },
  });
}

/**
 * Record cache hit/miss
 */
export function recordCacheAccess(hit: boolean) {
  monitoring.recordMetric('cache.access', 1, 'count', {
    hit: hit.toString(),
  });
}

/**
 * Record AI task execution
 */
export function recordAiTask(agentType: string, actionType: string, duration: number, success: boolean, costCents: number) {
  monitoring.recordMetric('ai.task', 1, 'count', {
    agentType,
    actionType,
    success: success.toString(),
  });

  monitoring.recordMetric('ai.cost', costCents, 'cents', {
    agentType,
    actionType,
  });

  monitoring.recordPerformance({
    operation: `ai.${agentType}.${actionType}`,
    duration,
    success,
    metadata: { costCents },
  });
}

/**
 * Record job queue metric
 */
export function recordJobQueue(jobType: string, status: 'enqueued' | 'processing' | 'completed' | 'failed') {
  monitoring.recordMetric('job.queue', 1, 'count', {
    jobType,
    status,
  });
}

/**
 * Record user action
 */
export function recordUserAction(action: string, orgId: string, userId: string) {
  monitoring.recordMetric('user.action', 1, 'count', {
    action,
    orgId,
    userId,
  });
}

/**
 * Report critical error
 */
export function reportCriticalError(error: Error, context: Record<string, any> = {}) {
  monitoring.reportError(error, context, 'critical');
}

/**
 * Report error with context
 */
export function reportError(error: Error, context: Record<string, any> = {}, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  monitoring.reportError(error, context, severity);
}

/**
 * Time an async operation
 */
export async function timeOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return monitoring.timeOperation(operation, fn, metadata);
}

// ===== HEALTH CHECK =====

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    cache: boolean;
    queue: boolean;
  };
  metrics: {
    errorRate: number;
    avgResponseTime: number;
  };
}

/**
 * Get system health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  // TODO: Implement actual health checks
  return {
    status: 'healthy',
    checks: {
      database: true,
      cache: true,
      queue: true,
    },
    metrics: {
      errorRate: 0,
      avgResponseTime: 0,
    },
  };
}


// src/lib/logger.ts
// Structured logging system for production-ready observability

// ===== LOG LEVELS =====

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// ===== LOG ENTRY =====

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  orgId?: string;
  userId?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
  duration?: number;
  [key: string]: any;
}

// ===== LOGGER CLASS =====

export class Logger {
  private context: Record<string, any> = {};
  private minLevel: LogLevel = LogLevel.INFO;

  constructor(context?: Record<string, any>) {
    this.context = context || {};

    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLevel && Object.values(LogLevel).includes(envLevel as LogLevel)) {
      this.minLevel = envLevel as LogLevel;
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...context });
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, {
      ...metadata,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          }
        : undefined,
    });
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.FATAL, message, {
      ...metadata,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          }
        : undefined,
    });
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    // Check if level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    };

    // Output to console (JSON format for production)
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // Pretty print for development
      const color = this.getLevelColor(level);
      const prefix = `[${entry.timestamp}] ${color}${level.toUpperCase()}\x1b[0m`;
      console.log(`${prefix} ${message}`, metadata || '');
    }

    // TODO: Send to external logging service (Datadog, Sentry, etc.)
  }

  /**
   * Check if log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const minIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= minIndex;
  }

  /**
   * Get ANSI color code for log level
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m'; // Cyan
      case LogLevel.INFO:
        return '\x1b[32m'; // Green
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.FATAL:
        return '\x1b[35m'; // Magenta
      default:
        return '\x1b[0m'; // Reset
    }
  }

  /**
   * Time a function execution
   */
  async time<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`Starting ${name}`);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed ${name}`, { duration });
      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      this.error(`Failed ${name}`, error, { duration });
      throw error;
    }
  }
}

// ===== SINGLETON INSTANCE =====

export const logger = new Logger();

// ===== REQUEST LOGGER MIDDLEWARE =====

/**
 * Create logger with request context
 */
export function createRequestLogger(req: any): Logger {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return logger.child({
    requestId,
    method: req.method,
    path: req.url,
    userAgent: req.headers['user-agent'],
  });
}

/**
 * Log request start
 */
export function logRequestStart(req: any) {
  const reqLogger = createRequestLogger(req);
  reqLogger.info('Request started', {
    method: req.method,
    path: req.url,
  });
  return reqLogger;
}

/**
 * Log request end
 */
export function logRequestEnd(req: any, res: any, duration: number) {
  const reqLogger = createRequestLogger(req);
  reqLogger.info('Request completed', {
    method: req.method,
    path: req.url,
    statusCode: res.statusCode,
    duration,
  });
}

/**
 * Log request error
 */
export function logRequestError(req: any, error: Error) {
  const reqLogger = createRequestLogger(req);
  reqLogger.error('Request failed', error, {
    method: req.method,
    path: req.url,
  });
}

// ===== HELPER FUNCTIONS =====

/**
 * Log API call
 */
export function logApiCall(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
) {
  logger.info('API call', {
    method,
    path,
    statusCode,
    duration,
    ...metadata,
  });
}

/**
 * Log database query
 */
export function logDbQuery(query: string, duration: number, metadata?: Record<string, any>) {
  logger.debug('Database query', {
    query: query.substring(0, 200), // Truncate long queries
    duration,
    ...metadata,
  });
}

/**
 * Log cache hit/miss
 */
export function logCacheAccess(key: string, hit: boolean, duration?: number) {
  logger.debug('Cache access', {
    key,
    hit,
    duration,
  });
}

/**
 * Log job processing
 */
export function logJobProcessing(jobId: string, jobType: string, status: 'started' | 'completed' | 'failed', metadata?: Record<string, any>) {
  if (status === 'failed') {
    logger.error(`Job ${status}`, undefined, {
      jobId,
      jobType,
      status,
      ...metadata,
    });
  } else {
    logger.info(`Job ${status}`, {
      jobId,
      jobType,
      status,
      ...metadata,
    });
  }
}


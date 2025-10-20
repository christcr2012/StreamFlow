/**
 * Environment variable validation and defaults
 */
export const env = {
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    DATABASE_URL: process.env.DATABASE_URL || '',
    WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '8', 10),
    WORKER_MAX_RETRIES: parseInt(process.env.WORKER_MAX_RETRIES || '5', 10),
    WORKER_BACKOFF_MS: parseInt(process.env.WORKER_BACKOFF_MS || '15000', 10),
    WORKER_DLQ_ENABLED: process.env.WORKER_DLQ_ENABLED !== 'false',
    PORT: parseInt(process.env.PORT || '8080', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    // AWS S3 Configuration
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'cortiware-uploads',
};
export function validateEnv() {
    if (!env.REDIS_URL) {
        throw new Error('REDIS_URL is required');
    }
    console.log('[env] Configuration loaded:', {
        concurrency: env.WORKER_CONCURRENCY,
        maxRetries: env.WORKER_MAX_RETRIES,
        backoffMs: env.WORKER_BACKOFF_MS,
        dlqEnabled: env.WORKER_DLQ_ENABLED,
    });
}
//# sourceMappingURL=env.js.map
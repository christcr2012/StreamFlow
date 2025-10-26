/**
 * @cortiware/queue
 *
 * Shared queue types, schemas, and helpers for BullMQ job system.
 * Used by both Vercel API (enqueue) and Worker (process).
 */
// ============================================================================
// Queue Configuration
// ============================================================================
export const QUEUE_NAMES = {
    IMPORT: 'import',
    SCHEDULE: 'schedule',
    BILLING: 'billing',
    QA: 'qa',
    MEDIA: 'media',
    PDF: 'pdf',
    VENDOR: 'vendor',
    STRIPE: 'stripe',
};
export const QUEUE_CONFIG = {
    defaultAttempts: 5,
    defaultBackoffMs: 15000,
    removeOnCompleteCount: 500,
    removeOnFailCount: 1000,
};
// ============================================================================
// Exports
// ============================================================================
// Note: Job processor implementations are exposed via the subpath export "@cortiware/queue/jobs"
// to avoid bundling worker-only code into apps (like Next.js) during build.
//# sourceMappingURL=index.js.map
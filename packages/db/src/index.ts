/**
 * Prisma Client Singleton for the Cortiware monorepo
 *
 * Uses provider-portal schema (has all federation models)
 * Optimized for Neon + Vercel with pooled connections
 *
 * Usage (in apps/packages):
 *   import { prisma } from '@cortiware/db';
 */

// Re-export optimized prisma client from connection.ts
export { prisma, checkDatabaseHealth, getConnectionStats, disconnectDatabase } from './connection';

export type { Prisma } from '@prisma/client-provider';

// Export error handling utilities
export * from './errors';

// Export slow query logger
export * from './middleware/slow-query-logger';

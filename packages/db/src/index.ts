import { PrismaClient } from '@prisma/client-provider';

/**
 * Prisma Client Singleton for the Cortiware monorepo
 *
 * Uses provider-portal schema (has all federation models)
 *
 * Usage (in apps/packages):
 *   import { prisma } from '@cortiware/db';
 */

declare global {
  // eslint-disable-next-line no-var
  var __cortiware_prisma__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__cortiware_prisma__ ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__cortiware_prisma__ = prisma;
}

// Slow query logging middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  // Log queries that take longer than 1 second
  if (duration > 1000) {
    console.warn(`[slow-query] ${params.model}.${params.action} took ${duration}ms`, {
      model: params.model,
      action: params.action,
      duration,
    });
  }

  return result;
});

export type { Prisma } from '@prisma/client-provider';

// Export error handling utilities
export * from './errors';

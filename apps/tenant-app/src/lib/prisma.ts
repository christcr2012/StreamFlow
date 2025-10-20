/**
 * Prisma Client for tenant-app
 *
 * Uses tenant-specific Prisma client generated to @prisma/client-tenant
 * Schema: prisma/schema.prisma (root level)
 */

import { PrismaClient } from '@prisma/client-tenant';

declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma client is generated from root schema (prisma/schema.prisma)
// Connection pool optimized for serverless (Vercel) - limit to 5 connections per instance
export const prisma = global.prisma || new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
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


/**
 * Shared Query Utilities
 *
 * Common database query patterns and error handling
 */

import { Prisma } from '@prisma/client-provider';

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

/**
 * Standard pagination result
 */
export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;

/**
 * Normalize pagination limit
 */
export function normalizePaginationLimit(limit?: number): number {
  if (!limit) return DEFAULT_PAGE_LIMIT;
  return Math.min(Math.max(1, limit), MAX_PAGE_LIMIT);
}

/**
 * Build cursor-based pagination query
 */
export function buildCursorPagination(params: PaginationParams) {
  const limit = normalizePaginationLimit(params.limit);
  
  return {
    take: limit + 1, // Take one extra to check if there are more
    ...(params.cursor && {
      skip: 1,
      cursor: { id: params.cursor },
    }),
  };
}

/**
 * Process paginated results
 */
export function processPaginatedResults<T extends { id: string }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? resultItems[resultItems.length - 1]?.id : null;

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  };
}

/**
 * Safe database query with error handling
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    if (errorMessage) {
      console.error(errorMessage, error);
    }
    return fallback;
  }
}

/**
 * Build search filter for text fields
 */
export function buildTextSearchFilter(
  query: string | undefined,
  fields: string[]
): any {
  if (!query || query.trim() === '') return undefined;

  const searchTerm = query.trim();
  
  return {
    OR: fields.map((field: any) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    })),
  };
}

/**
 * Build date range filter
 */
export function buildDateRangeFilter(
  field: string,
  start?: Date,
  end?: Date
): any {
  if (!start && !end) return undefined;

  const filter: any = {};
  
  if (start && end) {
    filter[field] = {
      gte: start,
      lte: end,
    };
  } else if (start) {
    filter[field] = {
      gte: start,
    };
  } else if (end) {
    filter[field] = {
      lte: end,
    };
  }

  return filter;
}

/**
 * Build status filter
 */
export function buildStatusFilter(
  field: string,
  status: string | undefined,
  allValue: string = 'ALL'
): any {
  if (!status || status === allValue) return undefined;

  return {
    [field]: status,
  };
}

/**
 * Combine filters with AND logic
 */
export function combineFilters(...filters: (any | undefined)[]): any {
  const validFilters = filters.filter((f: any) => f !== undefined && f !== null);
  
  if (validFilters.length === 0) return undefined;
  if (validFilters.length === 1) return validFilters[0];

  return {
    AND: validFilters,
  };
}

/**
 * Calculate percentage safely
 */
export function calculatePercentage(
  numerator: number,
  denominator: number,
  decimals: number = 2
): number {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(decimals));
}

/**
 * Calculate average safely
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc: any, val: any) => acc + val, 0);
  return sum / values.length;
}

/**
 * Group items by key
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc: any, item: any) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Sort items by field
 */
export function sortBy<T>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal < bVal ? -1 : 1;
    return direction === 'asc' ? comparison : -comparison;
  });
}


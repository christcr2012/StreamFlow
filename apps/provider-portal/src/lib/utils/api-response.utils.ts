/**
 * Shared API Response Utilities
 * 
 * Standardized API response formatting and error handling
 */

import { NextResponse } from 'next/server';
import type { ApiResponse, ErrorResponse, SuccessResponse } from '@/lib/types/common.types';

/**
 * Create a standardized success response
 *
 * @template T - The type of data being returned
 * @param data - The response data
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized success format
 *
 * @example
 * ```ts
 * return createSuccessResponse({ users: [...] }, 'Users retrieved successfully');
 * ```
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      ok: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create a standardized error response
 *
 * @param error - Error message
 * @param status - HTTP status code (default: 500)
 * @param code - Optional error code for client-side handling
 * @param details - Optional additional error details
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```ts
 * return createErrorResponse('User not found', 404, 'USER_NOT_FOUND');
 * ```
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: any
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      ok: false,
      error,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Create validation error response
 */
export function createValidationError(
  message: string,
  details?: any
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Create not found error response
 */
export function createNotFoundError(
  resource: string = 'Resource'
): NextResponse<ErrorResponse> {
  return createErrorResponse(`${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedError(
  message: string = 'Unauthorized'
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Create forbidden error response
 */
export function createForbiddenError(
  message: string = 'Forbidden'
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Create conflict error response
 */
export function createConflictError(
  message: string,
  details?: any
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 409, 'CONFLICT', details);
}

/**
 * Create rate limit error response
 */
export function createRateLimitError(
  message: string = 'Rate limit exceeded',
  retryAfter?: number
): NextResponse<ErrorResponse> {
  const response = createErrorResponse(message, 429, 'RATE_LIMIT_EXCEEDED');
  
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }
  
  return response;
}

/**
 * Create internal server error response
 */
export function createInternalServerError(
  message: string = 'Internal server error',
  error?: any
): NextResponse<ErrorResponse> {
  // Log the actual error for debugging
  if (error) {
    console.error('[Internal Server Error]', error);
  }
  
  return createErrorResponse(message, 500, 'INTERNAL_SERVER_ERROR');
}

/**
 * Handle async route with error catching
 * Supports route handlers with any number of parameters
 */
export function handleAsyncRoute<T, Args extends any[]>(
  handler: (...args: Args) => Promise<NextResponse<SuccessResponse<T>> | NextResponse<any>>,
  errorMessage: string = 'Operation failed'
): (...args: Args) => Promise<NextResponse<SuccessResponse<T> | ErrorResponse> | NextResponse<any>> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      console.error('[Route Error]', error);

      // Handle known error types
      if (error.code === 'P2002') {
        return createConflictError('Resource already exists');
      }

      if (error.code === 'P2025') {
        return createNotFoundError();
      }

      return createInternalServerError(
        error.message || errorMessage,
        error
      );
    }
  };
}

/**
 * Validate required fields
 * Throws an error if validation fails
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((field: any) => data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Parse request body safely
 * Throws an error if parsing fails
 */
export async function parseRequestBody<T = any>(
  request: Request
): Promise<T> {
  try {
    const data = await request.json();
    return data as T;
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Extract query parameters
 */
export function extractQueryParams(
  url: URL,
  params: string[]
): Record<string, string | undefined> {
  return params.reduce((acc: any, param: any) => {
    acc[param] = url.searchParams.get(param) || undefined;
    return acc;
  }, {} as Record<string, string | undefined>);
}

/**
 * Parse pagination params from URL
 */
export function parsePaginationParams(url: URL): {
  cursor?: string;
  limit?: number;
} {
  const cursor = url.searchParams.get('cursor') || undefined;
  const limitStr = url.searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;
  
  return { cursor, limit };
}

/**
 * Parse date range params from URL
 */
export function parseDateRangeParams(url: URL): {
  startDate?: Date;
  endDate?: Date;
} {
  const startDateStr = url.searchParams.get('startDate');
  const endDateStr = url.searchParams.get('endDate');
  
  return {
    startDate: startDateStr ? new Date(startDateStr) : undefined,
    endDate: endDateStr ? new Date(endDateStr) : undefined,
  };
}


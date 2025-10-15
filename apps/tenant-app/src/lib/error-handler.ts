/**
 * Error Handler Utility
 * 
 * SECURITY (P10): Sanitizes error messages to prevent technical details exposure
 * 
 * Provides safe error responses that:
 * - Hide database errors and stack traces from users
 * - Log full technical details for debugging
 * - Return user-friendly messages
 * - Maintain security by not exposing internal implementation
 */

import { NextResponse } from 'next/server';

/**
 * Sanitize error message for user display
 * Removes technical details while preserving useful information
 */
export function sanitizeErrorMessage(error: any): string {
  // Development mode: show more details for debugging
  if (process.env.NODE_ENV === 'development') {
    return error?.message || 'An error occurred';
  }

  // Production mode: generic messages only
  const message = error?.message || '';

  // Database errors
  if (message.includes('Prisma') || message.includes('database') || message.includes('SQL')) {
    return 'A database error occurred. Please try again later.';
  }

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
    return 'A network error occurred. Please check your connection.';
  }

  // Validation errors (safe to show)
  if (message.includes('validation') || message.includes('invalid')) {
    return message;
  }

  // Authentication errors (safe to show)
  if (message.includes('Unauthorized') || message.includes('Forbidden')) {
    return message;
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Create a safe error response
 * Logs full error details while returning sanitized message to user
 */
export function createSafeErrorResponse(
  error: any,
  context: string,
  status: number = 500
): NextResponse {
  // Log full error for debugging
  console.error(`[${context}] Error:`, error);
  if (error?.stack) {
    console.error(`[${context}] Stack:`, error.stack);
  }

  // Return sanitized error to user
  const userMessage = sanitizeErrorMessage(error);

  return NextResponse.json(
    { error: userMessage },
    { status }
  );
}

/**
 * Create validation error response
 */
export function createValidationError(message: string, details?: any): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      ...(details && { details })
    },
    { status: 400 }
  );
}

/**
 * Create not found error response
 */
export function createNotFoundError(resource: string = 'Resource'): NextResponse {
  return NextResponse.json(
    { error: `${resource} not found` },
    { status: 404 }
  );
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedError(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Wrap async route handler with error handling
 * Automatically catches and sanitizes errors
 */
export function withErrorHandling(
  handler: (req: any, params?: any) => Promise<NextResponse>,
  context: string
) {
  return async (req: any, params?: any): Promise<NextResponse> => {
    try {
      return await handler(req, params);
    } catch (error) {
      return createSafeErrorResponse(error, context);
    }
  };
}


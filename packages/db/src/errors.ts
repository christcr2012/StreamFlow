/**
 * User-friendly error handling utilities for API routes
 * Maps technical database/system errors to user-friendly messages
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export type ErrorResponse = {
  error: string;
  code?: string;
  details?: any;
};

/**
 * Maps Prisma error codes to user-friendly messages
 */
export function mapPrismaError(error: unknown): ErrorResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        const field = target[0] || 'field';
        return {
          error: `This ${field} already exists. Please use a different value.`,
          code: 'DUPLICATE_ENTRY',
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          error: 'This operation cannot be completed because it references data that does not exist.',
          code: 'INVALID_REFERENCE',
        };

      case 'P2025':
        // Record not found
        return {
          error: 'The requested item was not found.',
          code: 'NOT_FOUND',
        };

      case 'P2014':
        // Required relation violation
        return {
          error: 'This operation cannot be completed due to related data constraints.',
          code: 'RELATION_VIOLATION',
        };

      case 'P2000':
        // Value too long
        return {
          error: 'One or more values are too long. Please shorten your input.',
          code: 'VALUE_TOO_LONG',
        };

      case 'P2001':
        // Record does not exist
        return {
          error: 'The requested item does not exist.',
          code: 'NOT_FOUND',
        };

      case 'P2011':
        // Null constraint violation
        return {
          error: 'Required information is missing. Please provide all required fields.',
          code: 'MISSING_REQUIRED_FIELD',
        };

      case 'P2012':
        // Missing required value
        return {
          error: 'Required information is missing. Please provide all required fields.',
          code: 'MISSING_REQUIRED_FIELD',
        };

      case 'P2015':
        // Related record not found
        return {
          error: 'The related item was not found.',
          code: 'RELATED_NOT_FOUND',
        };

      case 'P2016':
        // Query interpretation error
        return {
          error: 'Invalid request. Please check your input and try again.',
          code: 'INVALID_REQUEST',
        };

      case 'P2021':
        // Table does not exist
        return {
          error: 'A system error occurred. Please contact support.',
          code: 'SYSTEM_ERROR',
        };

      case 'P2022':
        // Column does not exist
        return {
          error: 'A system error occurred. Please contact support.',
          code: 'SYSTEM_ERROR',
        };

      default:
        return {
          error: 'An error occurred while processing your request. Please try again.',
          code: 'DATABASE_ERROR',
        };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      error: 'Invalid data provided. Please check your input and try again.',
      code: 'VALIDATION_ERROR',
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      error: 'Unable to connect to the database. Please try again later.',
      code: 'CONNECTION_ERROR',
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      error: 'A system error occurred. Please contact support.',
      code: 'SYSTEM_ERROR',
    };
  }

  // Generic error
  return {
    error: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Maps common application errors to user-friendly messages
 */
export function mapApplicationError(error: unknown): ErrorResponse {
  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('not authorized')) {
      return {
        error: 'You do not have permission to perform this action.',
        code: 'UNAUTHORIZED',
      };
    }

    if (message.includes('forbidden') || message.includes('access denied')) {
      return {
        error: 'Access denied. You do not have permission to access this resource.',
        code: 'FORBIDDEN',
      };
    }

    if (message.includes('not found')) {
      return {
        error: 'The requested item was not found.',
        code: 'NOT_FOUND',
      };
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        error: 'The request took too long to complete. Please try again.',
        code: 'TIMEOUT',
      };
    }

    if (message.includes('network') || message.includes('connection')) {
      return {
        error: 'A network error occurred. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
      };
    }

    if (message.includes('invalid') || message.includes('validation')) {
      return {
        error: 'Invalid data provided. Please check your input and try again.',
        code: 'VALIDATION_ERROR',
      };
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return {
        error: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMIT',
      };
    }
  }

  return {
    error: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Creates a user-friendly error response for API routes
 * Automatically maps Prisma and application errors to friendly messages
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = 'An error occurred. Please try again.',
  status = 500
): NextResponse<ErrorResponse> {
  // Try Prisma error mapping first
  const prismaError = mapPrismaError(error);
  if (prismaError.code !== 'UNKNOWN_ERROR') {
    const statusCode = getStatusCodeForError(prismaError.code);
    return NextResponse.json(prismaError, { status: statusCode });
  }

  // Try application error mapping
  const appError = mapApplicationError(error);
  if (appError.code !== 'UNKNOWN_ERROR') {
    const statusCode = getStatusCodeForError(appError.code);
    return NextResponse.json(appError, { status: statusCode });
  }

  // Fallback to default message
  return NextResponse.json(
    { error: defaultMessage, code: 'ERROR' },
    { status }
  );
}

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCodeForError(code: string): number {
  switch (code) {
    case 'DUPLICATE_ENTRY':
      return 409; // Conflict
    case 'NOT_FOUND':
    case 'RELATED_NOT_FOUND':
      return 404; // Not Found
    case 'UNAUTHORIZED':
      return 401; // Unauthorized
    case 'FORBIDDEN':
      return 403; // Forbidden
    case 'VALIDATION_ERROR':
    case 'INVALID_REQUEST':
    case 'MISSING_REQUIRED_FIELD':
    case 'VALUE_TOO_LONG':
      return 400; // Bad Request
    case 'RATE_LIMIT':
      return 429; // Too Many Requests
    case 'TIMEOUT':
      return 408; // Request Timeout
    case 'CONNECTION_ERROR':
    case 'NETWORK_ERROR':
      return 503; // Service Unavailable
    case 'SYSTEM_ERROR':
    case 'DATABASE_ERROR':
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Validates that required fields are present in request data
 * Returns user-friendly error if validation fails
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; error?: ErrorResponse } {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: {
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_REQUIRED_FIELD',
        details: { missingFields },
      },
    };
  }

  return { valid: true };
}


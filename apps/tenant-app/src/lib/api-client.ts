/**
 * API Client with Retry Logic and Error Handling
 * 
 * Provides a robust fetch wrapper with:
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Error handling and logging
 * - Type-safe responses
 */

interface FetchOptions extends RequestInit {
  retry?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  };
  deduplicate?: boolean;
}

interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
}

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Create a cache key for request deduplication
 */
function createCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // HTTP status codes that should be retried
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }

  return false;
}

/**
 * Enhanced fetch with retry logic and error handling
 */
export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    retry = {},
    deduplicate = true,
    ...fetchOptions
  } = options;

  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = retry;

  // Request deduplication for GET requests
  if (deduplicate && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cacheKey = createCacheKey(url, fetchOptions);
    const pending = pendingRequests.get(cacheKey);
    
    if (pending) {
      return pending;
    }

    const promise = executeRequest<T>(url, fetchOptions, {
      maxAttempts,
      initialDelay,
      maxDelay,
      backoffMultiplier,
    });

    pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  return executeRequest<T>(url, fetchOptions, {
    maxAttempts,
    initialDelay,
    maxDelay,
    backoffMultiplier,
  });
}

/**
 * Execute request with retry logic
 */
async function executeRequest<T>(
  url: string,
  options: RequestInit,
  retryConfig: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  }
): Promise<T> {
  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle non-OK responses
      if (!response.ok) {
        const error: ApiError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.statusText = response.statusText;

        // Try to parse error response
        try {
          error.data = await response.json();
        } catch {
          // Response is not JSON
        }

        throw error;
      }

      // Parse successful response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      // Return response as-is for non-JSON responses
      return response as any;

    } catch (error: any) {
      lastError = error;

      // Don't retry if not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === retryConfig.maxAttempts) {
        throw error;
      }

      // Calculate backoff delay
      const delay = calculateBackoff(
        attempt,
        retryConfig.initialDelay,
        retryConfig.maxDelay,
        retryConfig.backoffMultiplier
      );

      console.warn(
        `Request failed (attempt ${attempt}/${retryConfig.maxAttempts}). Retrying in ${delay}ms...`,
        { url, error: error.message }
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Request failed');
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, options?: FetchOptions) =>
    apiFetch<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: FetchOptions) =>
    apiFetch<T>(url, { ...options, method: 'DELETE' }),
};

/**
 * Clear all pending requests (useful for cleanup)
 */
export function clearPendingRequests() {
  pendingRequests.clear();
}


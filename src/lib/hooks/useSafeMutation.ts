// src/lib/hooks/useSafeMutation.ts
import { useState, useCallback } from 'react';
import { syncEngine } from '../sync-engine';

// Generate a simple UUID-like string
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 📱 SAFE MUTATION HOOK
 * 
 * This hook provides offline-safe mutations with:
 * - Automatic queueing when offline
 * - Idempotency keys to prevent duplicates
 * - Automatic retry when connection restored
 * - Error handling and loading states
 * 
 * Usage:
 * ```tsx
 * const { mutate, isLoading, error } = useSafeMutation({
 *   mutationFn: async (data) => {
 *     const response = await fetch('/api/leads', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     });
 *     return response.json();
 *   },
 *   onSuccess: (data) => {
 *     console.log('Success!', data);
 *   }
 * });
 * 
 * // Call the mutation
 * mutate({ company: 'Acme Corp', ... });
 * ```
 */

interface UseSafeMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

interface UseSafeMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useSafeMutation<TData = any, TVariables = any>(
  options: UseSafeMutationOptions<TData, TVariables>
): UseSafeMutationReturn<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if online (SSR-safe)
      const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // Execute mutation directly
        const result = await options.mutationFn(variables);
        setData(result);
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      } else {
        // Queue mutation for later execution
        // Extract route and method from mutation function
        // This is a simplified approach - in production you'd want to pass these explicitly
        const mutationString = options.mutationFn.toString();
        const routeMatch = mutationString.match(/['"`](\/.+?)['"`]/);
        const methodMatch = mutationString.match(/method:\s*['"`](\w+)['"`]/i);

        const route = routeMatch ? routeMatch[1] : '/api/unknown';
        const method = (methodMatch ? methodMatch[1].toUpperCase() : 'POST') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

        // Determine entity type from route
        let entityType: 'lead' | 'workOrder' | 'timesheet' = 'lead';
        if (route.includes('work-order')) entityType = 'workOrder';
        if (route.includes('timesheet') || route.includes('clock')) entityType = 'timesheet';

        // Extract orgId from variables if available
        const orgId = (variables as any)?.orgId || 'unknown';

        await syncEngine.enqueueOperation(
          route,
          method,
          variables,
          orgId,
          entityType
        );

        // Return optimistic response
        setData(null);

        if (options.onSuccess) {
          // Call success callback with null data for offline mutations
          options.onSuccess(null as any);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed');
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
    } finally {
      setIsLoading(false);
      
      if (options.onSettled) {
        options.onSettled();
      }
    }
  }, [options]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    data,
    reset
  };
}

/**
 * Alternative: useMutation (alias for useSafeMutation)
 * 
 * Provides a more familiar API for developers used to react-query
 */
export const useMutation = useSafeMutation;


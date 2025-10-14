/**
 * Optimistic UI Updates Utility
 * 
 * Provides utilities for implementing optimistic updates in the UI
 * Updates UI immediately, then syncs with server
 */

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

export interface OptimisticUpdateOptions<T> {
  /**
   * Function to perform the actual mutation
   */
  mutate: () => Promise<T>;

  /**
   * Function to update the UI optimistically
   */
  onOptimisticUpdate?: () => void;

  /**
   * Function to revert the optimistic update on error
   */
  onRevert?: () => void;

  /**
   * Function called on successful mutation
   */
  onSuccess?: (data: T) => void;

  /**
   * Function called on error
   */
  onError?: (error: Error) => void;

  /**
   * Whether to refresh the router after success
   */
  refreshRouter?: boolean;
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T = any>() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (options: OptimisticUpdateOptions<T>) => {
      const {
        mutate,
        onOptimisticUpdate,
        onRevert,
        onSuccess,
        onError,
        refreshRouter = true,
      } = options;

      setIsLoading(true);
      setError(null);

      // Apply optimistic update immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate();
      }

      try {
        // Perform actual mutation
        const result = await mutate();

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        // Refresh router to get latest data
        if (refreshRouter) {
          router.refresh();
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        // Revert optimistic update
        if (onRevert) {
          onRevert();
        }

        // Call error callback
        if (onError) {
          onError(error);
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return {
    execute,
    isLoading,
    error,
  };
}

/**
 * Optimistic list operations
 */
export class OptimisticList<T extends { id: string }> {
  private items: T[];
  private setItems: (items: T[]) => void;

  constructor(items: T[], setItems: (items: T[]) => void) {
    this.items = items;
    this.setItems = setItems;
  }

  /**
   * Add item optimistically
   */
  add(item: T) {
    this.setItems([...this.items, item]);
  }

  /**
   * Update item optimistically
   */
  update(id: string, updates: Partial<T>) {
    this.setItems(
      this.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }

  /**
   * Remove item optimistically
   */
  remove(id: string) {
    this.setItems(this.items.filter((item) => item.id !== id));
  }

  /**
   * Revert to original items
   */
  revert(originalItems: T[]) {
    this.setItems(originalItems);
  }
}

/**
 * Example usage:
 * 
 * // In a component
 * const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
 * const { execute, isLoading } = useOptimisticUpdate();
 * 
 * const handleDelete = async (customerId: string) => {
 *   const originalCustomers = [...customers];
 *   const list = new OptimisticList(customers, setCustomers);
 * 
 *   await execute({
 *     mutate: async () => {
 *       const response = await fetch(`/api/customers/${customerId}`, {
 *         method: 'DELETE',
 *       });
 *       if (!response.ok) throw new Error('Failed to delete');
 *       return response.json();
 *     },
 *     onOptimisticUpdate: () => {
 *       list.remove(customerId);
 *     },
 *     onRevert: () => {
 *       list.revert(originalCustomers);
 *     },
 *     onSuccess: () => {
 *       showToast('Customer deleted successfully', 'success');
 *     },
 *     onError: (error) => {
 *       showToast(error.message, 'error');
 *     },
 *   });
 * };
 */

/**
 * Optimistic form submission
 */
export interface OptimisticFormOptions<TData, TResult> {
  /**
   * Form data to submit
   */
  data: TData;

  /**
   * API endpoint
   */
  endpoint: string;

  /**
   * HTTP method
   */
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /**
   * Optimistic update function
   */
  onOptimisticUpdate?: (data: TData) => void;

  /**
   * Revert function
   */
  onRevert?: () => void;

  /**
   * Success callback
   */
  onSuccess?: (result: TResult) => void;

  /**
   * Error callback
   */
  onError?: (error: Error) => void;

  /**
   * Refresh router after success
   */
  refreshRouter?: boolean;
}

export async function submitFormOptimistically<TData = any, TResult = any>(
  options: OptimisticFormOptions<TData, TResult>
): Promise<TResult> {
  const {
    data,
    endpoint,
    method = 'POST',
    onOptimisticUpdate,
    onRevert,
    onSuccess,
    onError,
  } = options;

  // Apply optimistic update
  if (onOptimisticUpdate) {
    onOptimisticUpdate(data);
  }

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (error) {
    // Revert optimistic update
    if (onRevert) {
      onRevert();
    }

    const err = error instanceof Error ? error : new Error('Unknown error');
    
    if (onError) {
      onError(err);
    }

    throw err;
  }
}


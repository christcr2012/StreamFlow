'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Offline Detection Hook
 * 
 * Provides offline/online status detection:
 * - Monitors navigator.onLine
 * - Listens to online/offline events
 * - Provides connection status
 * - Triggers callbacks on status change
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log('[Offline] Connection restored');
      setIsOnline(true);
      setWasOffline(true);

      // Trigger background sync if available
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          // @ts-ignore - Background Sync API may not be in TypeScript types yet
          if ('sync' in registration) {
            // @ts-ignore
            return registration.sync.register('sync-queued-actions');
          }
        }).catch((error) => {
          console.error('[Offline] Background sync registration failed:', error);
        });
      }
    };

    const handleOffline = () => {
      console.log('[Offline] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    resetWasOffline: () => setWasOffline(false),
  };
}

/**
 * Action Queue Hook
 * 
 * Provides action queuing for offline support:
 * - Queue actions when offline
 * - Execute actions when online
 * - Store in IndexedDB for persistence
 * - Handle conflicts on sync
 */
export function useActionQueue() {
  const { isOnline } = useOffline();
  const [queuedActions, setQueuedActions] = useState<any[]>([]);

  // Open IndexedDB
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CortiwareOffline', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('queuedActions')) {
          db.createObjectStore('queuedActions', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cachedData')) {
          db.createObjectStore('cachedData', { keyPath: 'key' });
        }
      };
    });
  }, []);

  // CODE QUALITY: Load queued actions (moved before queueAction to fix dependency order)
  const loadQueuedActions = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['queuedActions'], 'readonly');
      const store = transaction.objectStore('queuedActions');

      const actions = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      setQueuedActions(actions);
    } catch (error) {
      console.error('[ActionQueue] Failed to load queued actions:', error);
    }
  }, [openDB]);

  // Queue an action
  const queueAction = useCallback(async (action: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
    description?: string;
  }) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['queuedActions'], 'readwrite');
      const store = transaction.objectStore('queuedActions');

      const actionWithTimestamp = {
        ...action,
        timestamp: Date.now(),
      };

      await new Promise((resolve, reject) => {
        const request = store.add(actionWithTimestamp);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      console.log('[ActionQueue] Action queued:', action.description || action.url);

      // Update local state
      loadQueuedActions();
    } catch (error) {
      console.error('[ActionQueue] Failed to queue action:', error);
      throw error;
    }
  }, [openDB, loadQueuedActions]);

  // Execute queued actions
  const executeQueuedActions = useCallback(async () => {
    if (!isOnline || queuedActions.length === 0) return;
    
    console.log('[ActionQueue] Executing', queuedActions.length, 'queued actions');
    
    for (const action of queuedActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });
        
        if (response.ok) {
          // Remove from queue
          const db = await openDB();
          const transaction = db.transaction(['queuedActions'], 'readwrite');
          const store = transaction.objectStore('queuedActions');
          
          await new Promise((resolve, reject) => {
            const request = store.delete(action.id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          
          console.log('[ActionQueue] Action executed:', action.description || action.url);
        } else {
          console.error('[ActionQueue] Action failed:', action.description || action.url, response.status);
        }
      } catch (error) {
        console.error('[ActionQueue] Failed to execute action:', error);
      }
    }
    
    // Reload queued actions
    loadQueuedActions();
  }, [isOnline, queuedActions, openDB, loadQueuedActions]);

  // Load queued actions on mount
  useEffect(() => {
    loadQueuedActions();
  }, [loadQueuedActions]);

  // Execute queued actions when coming online
  useEffect(() => {
    if (isOnline && queuedActions.length > 0) {
      executeQueuedActions();
    }
  }, [isOnline, queuedActions.length, executeQueuedActions]);

  return {
    queueAction,
    queuedActions,
    executeQueuedActions,
    queuedCount: queuedActions.length,
  };
}

/**
 * Cached Data Hook
 * 
 * Provides data caching for offline support:
 * - Cache data in IndexedDB
 * - Retrieve cached data when offline
 * - Clear cache when needed
 */
export function useCachedData<T = any>(key: string) {
  const [cachedData, setCachedData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CortiwareOffline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cachedData')) {
          db.createObjectStore('cachedData', { keyPath: 'key' });
        }
      };
    });
  }, []);

  const cacheData = useCallback(async (data: T) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      
      await new Promise((resolve, reject) => {
        const request = store.put({ key, data, timestamp: Date.now() });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      setCachedData(data);
    } catch (error) {
      console.error('[CachedData] Failed to cache data:', error);
    }
  }, [key, openDB]);

  const loadCachedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await openDB();
      const transaction = db.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (result) {
        setCachedData(result.data);
      }
    } catch (error) {
      console.error('[CachedData] Failed to load cached data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [key, openDB]);

  const clearCache = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      
      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      setCachedData(null);
    } catch (error) {
      console.error('[CachedData] Failed to clear cache:', error);
    }
  }, [key, openDB]);

  return {
    cachedData,
    isLoading,
    cacheData,
    loadCachedData,
    clearCache,
  };
}


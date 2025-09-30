/**
 * Lazy-Loading Offline Database Wrapper
 * 
 * Purpose: Prevent SSR build errors by deferring Dexie instantiation until runtime
 * 
 * Problem: Dexie uses IndexedDB which is only available in browser environments.
 * When Next.js builds pages during SSR, it evaluates modules at build time, causing
 * "window is not defined" errors if Dexie is instantiated at module load.
 * 
 * Solution: Lazy-load the offline database only when actually needed in the browser.
 * This wrapper provides the same API as offline-db.ts but defers initialization.
 */

import type Dexie from 'dexie';

// Type imports (these don't cause SSR issues)
type OfflineDB = {
  leads: Dexie.Table<any, string>;
  workOrders: Dexie.Table<any, string>;
  timesheets: Dexie.Table<any, string>;
  pending: Dexie.Table<any, string>;
};

// Singleton instance
let dbInstance: OfflineDB | null = null;
let initPromise: Promise<OfflineDB> | null = null;

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

/**
 * Initialize the offline database (lazy)
 * This function is only called when actually needed in the browser
 */
async function initializeDB(): Promise<OfflineDB> {
  // Return existing instance if already initialized
  if (dbInstance) {
    return dbInstance;
  }

  // Return existing promise if initialization in progress
  if (initPromise) {
    return initPromise;
  }

  // Check if we're in a browser
  if (!isBrowser()) {
    throw new Error('Offline database can only be initialized in browser environment');
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // Dynamic import of Dexie (only loads in browser)
      const { default: Dexie } = await import('dexie');
      
      // Create database instance
      const db = new Dexie('StreamFlowOffline') as any;

      // Define schema
      db.version(1).stores({
        leads: 'id, orgId, status, createdAt, updatedAt',
        workOrders: 'id, orgId, status, scheduledStartAt',
        timesheets: 'id, orgId, employeeId, clockInAt, clockOutAt',
        pending: '++id, route, orgId, createdAt, idemKey'
      });

      dbInstance = db;
      return db;
    } catch (error) {
      initPromise = null; // Reset promise on error
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the offline database instance
 * Initializes on first call (browser only)
 */
export async function getOfflineDB(): Promise<OfflineDB> {
  if (!isBrowser()) {
    throw new Error('Offline database is only available in browser');
  }

  return initializeDB();
}

/**
 * Check if offline database is available
 * Returns false during SSR or if IndexedDB is not supported
 */
export function isOfflineDBAvailable(): boolean {
  return isBrowser();
}

/**
 * Reset the database instance (for testing)
 */
export function resetOfflineDB(): void {
  dbInstance = null;
  initPromise = null;
}

/**
 * Safe wrapper for database operations
 * Returns null if database is not available (SSR)
 */
export async function withOfflineDB<T>(
  operation: (db: OfflineDB) => Promise<T>
): Promise<T | null> {
  if (!isOfflineDBAvailable()) {
    return null;
  }

  try {
    const db = await getOfflineDB();
    return await operation(db);
  } catch (error) {
    console.error('Offline DB operation failed:', error);
    return null;
  }
}

// Re-export types for convenience
export type { OfflineDB };


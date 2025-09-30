// src/lib/sync-engine.ts
import { offlineDB, PendingOperation, OfflineLead, OfflineWorkOrder, OfflineTimesheet } from './offline-db';
import { consolidatedAudit } from './consolidated-audit';

/**
 * 🔄 OFFLINE SYNC ENGINE
 *
 * This module handles synchronization between offline data and the server.
 * Features:
 * - Operation queuing for offline actions
 * - Automatic retry with exponential backoff
 * - Conflict resolution with server-wins strategy
 * - Idempotency key management
 * - Background sync when online
 */

// ===================================================================
// TYPES & INTERFACES
// ===================================================================

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: ConflictInfo[];
  errors: string[];
}

export interface ConflictInfo {
  entityType: string;
  entityId: string;
  localVersion: string;
  serverVersion: string;
  resolution: 'server-wins' | 'manual-required';
}

export interface SyncOptions {
  force?: boolean; // Force sync even if recently synced
  entityTypes?: ('lead' | 'workOrder' | 'timesheet')[]; // Specific entities to sync
  maxRetries?: number;
  batchSize?: number;
}

// ===================================================================
// SYNC ENGINE CLASS
// ===================================================================

export class SyncEngine {
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Start periodic sync when online
      if (this.isOnline) {
        this.startPeriodicSync();
      }
    }
  }

  /**
   * Queue an operation for later sync
   */
  async enqueueOperation(
    route: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    payload: any,
    orgId: string,
    entityType: 'lead' | 'workOrder' | 'timesheet',
    entityId?: string,
    localId?: string
  ): Promise<string> {
    const idempotencyKey = this.generateIdempotencyKey();
    const operation: PendingOperation = {
      id: crypto.randomUUID(),
      route,
      method,
      payload,
      orgId,
      idempotencyKey,
      entityType,
      entityId,
      localId,
      createdAt: new Date().toISOString(),
      attempts: 0,
      priority: this.getPriority(method, entityType)
    };

    await offlineDB.pendingOperations.add(operation);
    
    // Log the queued operation
    await consolidatedAudit.logSystemAdmin(
      'OFFLINE_OPERATION_QUEUED',
      'system@streamflow.com',
      'CLIENT',
      'SYNC_ENGINE',
      {},
      {
        operationId: operation.id,
        route,
        method,
        entityType,
        entityId,
        idempotencyKey,
        timestamp: new Date().toISOString()
      }
    );

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.syncPendingOperations(), 100);
    }

    return idempotencyKey;
  }

  /**
   * Replay queued operations when connection is restored
   */
  async replayQueue(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflicts: [],
      errors: []
    };

    try {
      // Get pending operations sorted by priority and creation time
      const operations = await offlineDB.pendingOperations
        .orderBy(['priority', 'createdAt'])
        .toArray();

      const batchSize = options.batchSize || 10;
      const maxRetries = options.maxRetries || 3;

      // Process operations in batches
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        
        for (const operation of batch) {
          try {
            await this.executeOperation(operation, maxRetries);
            result.syncedCount++;
          } catch (error) {
            result.failedCount++;
            result.errors.push(`Operation ${operation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.success = false;
          }
        }

        // Small delay between batches to avoid overwhelming the server
        if (i + batchSize < operations.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Log sync completion
      await consolidatedAudit.logSystemAdmin(
        'OFFLINE_SYNC_COMPLETED',
        'system@streamflow.com',
        'CLIENT',
        'SYNC_ENGINE',
        {},
        {
          syncedCount: result.syncedCount,
          failedCount: result.failedCount,
          conflictsCount: result.conflicts.length,
          success: result.success,
          timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Execute a single operation with retry logic
   */
  private async executeOperation(operation: PendingOperation, maxRetries: number): Promise<void> {
    const { route, method, payload, idempotencyKey } = operation;

    try {
      const response = await fetch(route, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: method !== 'GET' ? JSON.stringify(payload) : undefined,
      });

      if (response.ok) {
        // Operation succeeded, remove from queue
        await offlineDB.pendingOperations.delete(operation.id);
        
        // Update local record if needed
        if (method !== 'DELETE' && operation.entityId) {
          const serverData = await response.json();
          await this.updateLocalRecord(operation.entityType, serverData);
        }
      } else if (response.status === 409) {
        // Conflict - server has newer version
        await this.handleConflict(operation, response);
      } else if (response.status >= 400 && response.status < 500) {
        // Client error - don't retry
        await offlineDB.pendingOperations.delete(operation.id);
        throw new Error(`Client error ${response.status}: ${response.statusText}`);
      } else {
        // Server error - retry
        throw new Error(`Server error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Update operation with retry info
      const attempts = operation.attempts + 1;
      
      if (attempts >= maxRetries) {
        // Max retries reached, remove from queue
        await offlineDB.pendingOperations.delete(operation.id);
        throw error;
      } else {
        // Schedule retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
        
        await offlineDB.pendingOperations.update(operation.id, {
          attempts,
          lastAttemptAt: new Date().toISOString(),
          lastError: error instanceof Error ? error.message : 'Unknown error'
        });

        // Schedule retry
        setTimeout(() => {
          this.executeOperation(operation, maxRetries).catch(console.error);
        }, delay);
      }
    }
  }

  /**
   * Handle conflict resolution (server-wins strategy)
   */
  private async handleConflict(operation: PendingOperation, response: Response): Promise<void> {
    try {
      const serverData = await response.json();
      
      // Update local record with server version
      await this.updateLocalRecord(operation.entityType, serverData);
      
      // Remove operation from queue
      await offlineDB.pendingOperations.delete(operation.id);
      
      // Log conflict resolution
      await consolidatedAudit.logSystemAdmin(
        'SYNC_CONFLICT_RESOLVED',
        'system@streamflow.com',
        'CLIENT',
        'SYNC_ENGINE',
        {},
        {
          operationId: operation.id,
          entityType: operation.entityType,
          entityId: operation.entityId,
          resolution: 'server-wins',
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error handling conflict:', error);
      throw error;
    }
  }

  /**
   * Update local record with server data
   */
  private async updateLocalRecord(
    entityType: 'lead' | 'workOrder' | 'timesheet',
    serverData: any
  ): Promise<void> {
    const now = new Date().toISOString();
    const updateData = {
      ...serverData,
      _isDirty: false,
      _lastSyncAt: now
    };

    switch (entityType) {
      case 'lead':
        await offlineDB.leads.put(updateData as OfflineLead);
        break;
      case 'workOrder':
        await offlineDB.workOrders.put(updateData as OfflineWorkOrder);
        break;
      case 'timesheet':
        await offlineDB.timesheets.put(updateData as OfflineTimesheet);
        break;
    }
  }

  /**
   * Generate unique idempotency key
   */
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${crypto.randomUUID()}`;
  }

  /**
   * Get operation priority (lower number = higher priority)
   */
  private getPriority(method: string, entityType: string): number {
    // Time-sensitive operations get higher priority
    if (entityType === 'timesheet') return 1;
    if (method === 'POST') return 2; // Creates
    if (method === 'PUT' || method === 'PATCH') return 3; // Updates
    if (method === 'DELETE') return 4; // Deletes
    return 5; // Everything else
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    this.startPeriodicSync();
    
    // Trigger immediate sync
    setTimeout(() => {
      if (!this.isSyncing) {
        this.syncPendingOperations();
      }
    }, 1000);
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
    this.stopPeriodicSync();
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingOperations();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync pending operations
   */
  private async syncPendingOperations(): Promise<void> {
    try {
      await this.replayQueue();
    } catch (error) {
      console.error('Error syncing pending operations:', error);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncAt?: string;
  }> {
    const pendingCount = await offlineDB.pendingOperations.count();
    const lastSync = await offlineDB.syncMetadata
      .orderBy('lastSyncAt')
      .reverse()
      .first();

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncAt: lastSync?.lastSyncAt
    };
  }

  /**
   * Force sync all data
   */
  async forceSyncAll(): Promise<SyncResult> {
    return this.replayQueue({ force: true });
  }

  /**
   * Clear all offline data (use with caution)
   */
  async clearOfflineData(): Promise<void> {
    await offlineDB.transaction('rw', [
      offlineDB.leads,
      offlineDB.workOrders,
      offlineDB.timesheets,
      offlineDB.pendingOperations,
      offlineDB.syncMetadata
    ], async () => {
      await offlineDB.leads.clear();
      await offlineDB.workOrders.clear();
      await offlineDB.timesheets.clear();
      await offlineDB.pendingOperations.clear();
      await offlineDB.syncMetadata.clear();
    });
  }
}

// ===================================================================
// SINGLETON INSTANCE
// ===================================================================

export const syncEngine = new SyncEngine();

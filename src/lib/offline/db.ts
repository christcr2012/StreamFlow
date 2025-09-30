/**
 * Module: Offline Database
 * Purpose: Dexie IndexedDB schema for offline-first functionality
 * Scope: Client-side offline storage
 * Notes: Codex Phase 5 - PWA offline sync with Dexie
 */

import Dexie, { type Table } from 'dexie';

// IDEMPOTENCY: All mutations include idempotencyKey for replay safety

/**
 * Pending mutation to be replayed when online
 */
export interface PendingMutation {
  id?: number;
  orgId: string;
  endpoint: string;
  method: string;
  body: any;
  idempotencyKey: string;
  createdAt: number;
  retries: number;
  lastError?: string;
}

/**
 * Offline lead data
 */
export interface OfflineLead {
  id: string;
  orgId: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  source?: string;
  notes?: string;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

/**
 * Offline work order data
 */
export interface OfflineWorkOrder {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  status: string;
  assignedTo?: string;
  customerId?: string;
  scheduledAt?: number;
  completedAt?: number;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

/**
 * Offline time clock entry
 */
export interface OfflineTimeEntry {
  id: string;
  orgId: string;
  userId: string;
  clockIn: number;
  clockOut?: number;
  breakMinutes?: number;
  notes?: string;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

/**
 * Offline customer data
 */
export interface OfflineCustomer {
  id: string;
  orgId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

/**
 * StreamFlow Offline Database
 * Stores data for offline-first functionality
 */
class StreamFlowOfflineDB extends Dexie {
  // Pending mutations queue
  pending!: Table<PendingMutation, number>;
  
  // Business entity tables
  leads!: Table<OfflineLead, string>;
  workOrders!: Table<OfflineWorkOrder, string>;
  timeEntries!: Table<OfflineTimeEntry, string>;
  customers!: Table<OfflineCustomer, string>;

  constructor() {
    super('StreamFlowOffline');
    
    // Define schema version 1
    this.version(1).stores({
      // Pending mutations - indexed by orgId, createdAt, and idempotencyKey
      pending: '++id, orgId, createdAt, idempotencyKey, retries',
      
      // Leads - indexed by orgId and updatedAt for sync
      leads: 'id, orgId, updatedAt, syncStatus, [orgId+updatedAt]',
      
      // Work orders - indexed by orgId, status, and updatedAt
      workOrders: 'id, orgId, updatedAt, syncStatus, status, [orgId+status], [orgId+updatedAt]',
      
      // Time entries - indexed by orgId, userId, and clockIn
      timeEntries: 'id, orgId, userId, clockIn, updatedAt, syncStatus, [orgId+userId], [orgId+clockIn]',
      
      // Customers - indexed by orgId and updatedAt
      customers: 'id, orgId, updatedAt, syncStatus, [orgId+updatedAt]',
    });
  }

  /**
   * Clear all data for a specific organization
   * Useful for logout or org switching
   */
  async clearOrgData(orgId: string): Promise<void> {
    await this.transaction('rw', [this.pending, this.leads, this.workOrders, this.timeEntries, this.customers], async () => {
      await this.pending.where('orgId').equals(orgId).delete();
      await this.leads.where('orgId').equals(orgId).delete();
      await this.workOrders.where('orgId').equals(orgId).delete();
      await this.timeEntries.where('orgId').equals(orgId).delete();
      await this.customers.where('orgId').equals(orgId).delete();
    });
  }

  /**
   * Get count of pending mutations for an org
   */
  async getPendingCount(orgId: string): Promise<number> {
    return await this.pending.where('orgId').equals(orgId).count();
  }

  /**
   * Get all pending mutations for an org, ordered by creation time
   */
  async getPendingMutations(orgId: string): Promise<PendingMutation[]> {
    return await this.pending
      .where('orgId')
      .equals(orgId)
      .sortBy('createdAt');
  }

  /**
   * Add a pending mutation to the queue
   */
  async addPendingMutation(mutation: Omit<PendingMutation, 'id'>): Promise<number> {
    return await this.pending.add(mutation as PendingMutation);
  }

  /**
   * Remove a pending mutation after successful sync
   */
  async removePendingMutation(id: number): Promise<void> {
    await this.pending.delete(id);
  }

  /**
   * Update retry count and error for a failed mutation
   */
  async updateMutationRetry(id: number, error: string): Promise<void> {
    const mutation = await this.pending.get(id);
    if (mutation) {
      await this.pending.update(id, {
        retries: mutation.retries + 1,
        lastError: error,
      });
    }
  }

  /**
   * Get all entities with pending sync status
   */
  async getPendingSyncItems(orgId: string): Promise<{
    leads: OfflineLead[];
    workOrders: OfflineWorkOrder[];
    timeEntries: OfflineTimeEntry[];
    customers: OfflineCustomer[];
  }> {
    return {
      leads: await this.leads.where({ orgId, syncStatus: 'pending' }).toArray(),
      workOrders: await this.workOrders.where({ orgId, syncStatus: 'pending' }).toArray(),
      timeEntries: await this.timeEntries.where({ orgId, syncStatus: 'pending' }).toArray(),
      customers: await this.customers.where({ orgId, syncStatus: 'pending' }).toArray(),
    };
  }

  /**
   * Mark entity as synced
   */
  async markAsSynced(table: 'leads' | 'workOrders' | 'timeEntries' | 'customers', id: string): Promise<void> {
    await this[table].update(id, { syncStatus: 'synced' });
  }

  /**
   * Mark entity as conflict
   */
  async markAsConflict(table: 'leads' | 'workOrders' | 'timeEntries' | 'customers', id: string): Promise<void> {
    await this[table].update(id, { syncStatus: 'conflict' });
  }

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;
      
      return { usage, quota, percentage };
    }
    
    return { usage: 0, quota: 0, percentage: 0 };
  }

  /**
   * Clear old synced data (keep last 30 days)
   */
  async clearOldSyncedData(orgId: string, daysToKeep: number = 30): Promise<void> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    await this.transaction('rw', [this.leads, this.workOrders, this.timeEntries, this.customers], async () => {
      await this.leads
        .where('orgId').equals(orgId)
        .and(item => item.syncStatus === 'synced' && item.updatedAt < cutoffTime)
        .delete();
      
      await this.workOrders
        .where('orgId').equals(orgId)
        .and(item => item.syncStatus === 'synced' && item.updatedAt < cutoffTime)
        .delete();
      
      await this.timeEntries
        .where('orgId').equals(orgId)
        .and(item => item.syncStatus === 'synced' && item.updatedAt < cutoffTime)
        .delete();
      
      await this.customers
        .where('orgId').equals(orgId)
        .and(item => item.syncStatus === 'synced' && item.updatedAt < cutoffTime)
        .delete();
    });
  }
}

// Export singleton instance
export const offlineDB = new StreamFlowOfflineDB();

// Export types
export type { Table };

// PR-CHECKS:
// - [x] Dexie database schema defined
// - [x] pending table for mutation queue
// - [x] leads, workOrders, timeEntries, customers tables
// - [x] orgId scoping on all tables
// - [x] updatedAt for sync tracking
// - [x] Helper methods for common operations


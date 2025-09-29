// src/lib/offline-db.ts
import Dexie, { Table } from 'dexie';

/**
 * 📱 OFFLINE DATABASE SCHEMA & SYNC ENGINE
 * 
 * This module provides offline-first data storage using IndexedDB via Dexie.
 * It includes:
 * - Local data caching for leads, work orders, timesheets
 * - Operation queue for offline actions
 * - Sync engine with conflict resolution
 * - Idempotency key management
 */

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

export interface OfflineLead {
  id: string;
  orgId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
  score?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Offline-specific fields
  _localId?: string; // For offline-created records
  _isDirty?: boolean; // Needs sync
  _isDeleted?: boolean; // Soft delete
  _lastSyncAt?: string;
}

export interface OfflineWorkOrder {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  // Offline-specific fields
  _localId?: string;
  _isDirty?: boolean;
  _isDeleted?: boolean;
  _lastSyncAt?: string;
}

export interface OfflineTimesheet {
  id: string;
  orgId: string;
  userId: string;
  workOrderId?: string;
  clockIn: string;
  clockOut?: string;
  breakDuration?: number; // minutes
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  createdAt: string;
  updatedAt: string;
  // Offline-specific fields
  _localId?: string;
  _isDirty?: boolean;
  _isDeleted?: boolean;
  _lastSyncAt?: string;
}

export interface PendingOperation {
  id: string;
  route: string; // API endpoint
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  orgId: string;
  idempotencyKey: string;
  entityType: 'lead' | 'workOrder' | 'timesheet';
  entityId?: string;
  localId?: string; // For offline-created entities
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  priority: number; // Lower number = higher priority
}

export interface SyncMetadata {
  id: string;
  entityType: 'lead' | 'workOrder' | 'timesheet';
  lastSyncAt: string;
  lastSyncVersion?: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

// ===================================================================
// DEXIE DATABASE CLASS
// ===================================================================

export class OfflineDatabase extends Dexie {
  // Tables
  leads!: Table<OfflineLead>;
  workOrders!: Table<OfflineWorkOrder>;
  timesheets!: Table<OfflineTimesheet>;
  pendingOperations!: Table<PendingOperation>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('StreamFlowOfflineDB');
    
    this.version(1).stores({
      leads: '++id, orgId, status, createdAt, updatedAt, _isDirty, _isDeleted',
      workOrders: '++id, orgId, status, assignedTo, dueDate, createdAt, updatedAt, _isDirty, _isDeleted',
      timesheets: '++id, orgId, userId, workOrderId, clockIn, clockOut, createdAt, updatedAt, _isDirty, _isDeleted',
      pendingOperations: '++id, route, method, orgId, entityType, createdAt, priority, attempts',
      syncMetadata: '++id, entityType, lastSyncAt, syncStatus'
    });

    // Hooks for automatic dirty marking
    this.leads.hook('creating', (primKey, obj, trans) => {
      (obj as any)._isDirty = true;
      (obj as any)._lastSyncAt = undefined;
    });

    this.leads.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any)._isDirty = true;
      (modifications as any)._lastSyncAt = undefined;
    });

    this.workOrders.hook('creating', (primKey, obj, trans) => {
      (obj as any)._isDirty = true;
      (obj as any)._lastSyncAt = undefined;
    });

    this.workOrders.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any)._isDirty = true;
      (modifications as any)._lastSyncAt = undefined;
    });

    this.timesheets.hook('creating', (primKey, obj, trans) => {
      (obj as any)._isDirty = true;
      (obj as any)._lastSyncAt = undefined;
    });

    this.timesheets.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any)._isDirty = true;
      (modifications as any)._lastSyncAt = undefined;
    });
  }

  /**
   * Get all dirty (unsynced) records for a specific entity type
   */
  async getDirtyRecords(entityType: 'lead' | 'workOrder' | 'timesheet', orgId: string) {
    switch (entityType) {
      case 'lead':
        return this.leads.where({ orgId, _isDirty: true }).toArray();
      case 'workOrder':
        return this.workOrders.where({ orgId, _isDirty: true }).toArray();
      case 'timesheet':
        return this.timesheets.where({ orgId, _isDirty: true }).toArray();
      default:
        return [];
    }
  }

  /**
   * Mark records as synced
   */
  async markAsSynced(entityType: 'lead' | 'workOrder' | 'timesheet', ids: string[]) {
    const now = new Date().toISOString();
    
    switch (entityType) {
      case 'lead':
        await this.leads.where('id').anyOf(ids).modify({
          _isDirty: false,
          _lastSyncAt: now
        });
        break;
      case 'workOrder':
        await this.workOrders.where('id').anyOf(ids).modify({
          _isDirty: false,
          _lastSyncAt: now
        });
        break;
      case 'timesheet':
        await this.timesheets.where('id').anyOf(ids).modify({
          _isDirty: false,
          _lastSyncAt: now
        });
        break;
    }
  }

  /**
   * Soft delete a record (mark as deleted but keep for sync)
   */
  async softDelete(entityType: 'lead' | 'workOrder' | 'timesheet', id: string) {
    const now = new Date().toISOString();
    
    switch (entityType) {
      case 'lead':
        await this.leads.update(id, {
          _isDeleted: true,
          _isDirty: true,
          _lastSyncAt: undefined,
          updatedAt: now
        });
        break;
      case 'workOrder':
        await this.workOrders.update(id, {
          _isDeleted: true,
          _isDirty: true,
          _lastSyncAt: undefined,
          updatedAt: now
        });
        break;
      case 'timesheet':
        await this.timesheets.update(id, {
          _isDeleted: true,
          _isDirty: true,
          _lastSyncAt: undefined,
          updatedAt: now
        });
        break;
    }
  }

  /**
   * Clean up synced deleted records
   */
  async cleanupDeletedRecords() {
    await this.leads.where('_isDeleted' as any).equals(true as any).and(record => !record._isDirty).delete();
    await this.workOrders.where('_isDeleted' as any).equals(true as any).and(record => !record._isDirty).delete();
    await this.timesheets.where('_isDeleted' as any).equals(true as any).and(record => !record._isDirty).delete();
  }
}

// ===================================================================
// SINGLETON INSTANCE
// ===================================================================

export const offlineDB = new OfflineDatabase();

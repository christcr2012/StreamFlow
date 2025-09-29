// src/lib/hooks/useOfflineLeads.ts
import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { offlineDB, OfflineLead } from '../offline-db';
import { syncEngine } from '../sync-engine';
import { useMe } from '../useMe';

/**
 * 📱 OFFLINE-FIRST LEADS HOOK
 * 
 * This hook provides offline-first lead management with:
 * - Local-first data access (IndexedDB)
 * - Automatic sync when online
 * - Optimistic updates
 * - Conflict resolution
 * - Queue management for offline operations
 */

interface UseOfflineLeadsOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

interface UseOfflineLeadsReturn {
  leads: OfflineLead[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  
  // CRUD operations
  createLead: (lead: Omit<OfflineLead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateLead: (id: string, updates: Partial<OfflineLead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  
  // Sync operations
  syncNow: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
  
  // Utility functions
  getLeadById: (id: string) => OfflineLead | undefined;
  getLeadsByStatus: (status: OfflineLead['status']) => OfflineLead[];
  getDirtyLeads: () => OfflineLead[];
}

export function useOfflineLeads(options: UseOfflineLeadsOptions = {}): UseOfflineLeadsReturn {
  const { me } = useMe();
  const [leads, setLeads] = useState<OfflineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const orgId = me?.orgId;

  // SWR for server data (when online)
  const { data: serverLeads, error: serverError, mutate } = useSWR(
    isOnline && orgId ? `/api/leads?orgId=${orgId}` : null,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    {
      refreshInterval: options.syncInterval || 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Load leads from IndexedDB
  const loadLocalLeads = useCallback(async () => {
    if (!orgId) return;
    
    try {
      setLoading(true);
      const localLeads = await offlineDB.leads
        .where('orgId')
        .equals(orgId)
        .and(lead => !lead._isDeleted)
        .toArray();
      
      setLeads(localLeads);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local leads');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Sync server data to local storage
  const syncServerToLocal = useCallback(async () => {
    if (!serverLeads || !orgId) return;
    
    try {
      // Update local database with server data
      for (const serverLead of serverLeads) {
        const existingLead = await offlineDB.leads.get(serverLead.id);
        
        if (!existingLead || !existingLead._isDirty) {
          // Only update if local version is not dirty (no pending changes)
          await offlineDB.leads.put({
            ...serverLead,
            orgId,
            _isDirty: false,
            _lastSyncAt: new Date().toISOString()
          });
        }
      }
      
      // Reload local leads
      await loadLocalLeads();
    } catch (err) {
      console.error('Error syncing server data to local:', err);
    }
  }, [serverLeads, orgId, loadLocalLeads]);

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await syncEngine.getSyncStatus();
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
    } catch (err) {
      console.error('Error getting sync status:', err);
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadLocalLeads();
    updateSyncStatus();
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadLocalLeads, updateSyncStatus]);

  // Sync server data when available
  useEffect(() => {
    if (serverLeads && !serverError) {
      syncServerToLocal();
    }
  }, [serverLeads, serverError, syncServerToLocal]);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, [updateSyncStatus]);

  // CRUD Operations
  const createLead = useCallback(async (leadData: Omit<OfflineLead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!orgId) throw new Error('No organization ID available');
    
    const now = new Date().toISOString();
    const localId = crypto.randomUUID();
    const lead: OfflineLead = {
      ...leadData,
      id: localId, // Will be replaced with server ID when synced
      orgId,
      createdAt: now,
      updatedAt: now,
      _localId: localId,
      _isDirty: true
    };

    // Add to local database
    await offlineDB.leads.add(lead);
    
    // Queue for sync
    await syncEngine.enqueueOperation(
      '/api/leads',
      'POST',
      leadData,
      orgId,
      'lead',
      undefined,
      localId
    );

    // Reload local leads
    await loadLocalLeads();
    
    return localId;
  }, [orgId, loadLocalLeads]);

  const updateLead = useCallback(async (id: string, updates: Partial<OfflineLead>): Promise<void> => {
    if (!orgId) throw new Error('No organization ID available');
    
    const now = new Date().toISOString();
    const updateData = {
      ...updates,
      updatedAt: now,
      _isDirty: true,
      _lastSyncAt: undefined
    };

    // Update local database
    await offlineDB.leads.update(id, updateData);
    
    // Queue for sync
    await syncEngine.enqueueOperation(
      `/api/leads/${id}`,
      'PATCH',
      updates,
      orgId,
      'lead',
      id
    );

    // Reload local leads
    await loadLocalLeads();
  }, [orgId, loadLocalLeads]);

  const deleteLead = useCallback(async (id: string): Promise<void> => {
    if (!orgId) throw new Error('No organization ID available');
    
    // Soft delete locally
    await offlineDB.softDelete('lead', id);
    
    // Queue for sync
    await syncEngine.enqueueOperation(
      `/api/leads/${id}`,
      'DELETE',
      {},
      orgId,
      'lead',
      id
    );

    // Reload local leads
    await loadLocalLeads();
  }, [orgId, loadLocalLeads]);

  // Sync operations
  const syncNow = useCallback(async (): Promise<void> => {
    try {
      setIsSyncing(true);
      await syncEngine.forceSyncAll();
      await mutate(); // Refresh server data
      await loadLocalLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [mutate, loadLocalLeads]);

  const refreshFromServer = useCallback(async (): Promise<void> => {
    await mutate();
  }, [mutate]);

  // Utility functions
  const getLeadById = useCallback((id: string): OfflineLead | undefined => {
    return leads.find(lead => lead.id === id);
  }, [leads]);

  const getLeadsByStatus = useCallback((status: OfflineLead['status']): OfflineLead[] => {
    return leads.filter(lead => lead.status === status);
  }, [leads]);

  const getDirtyLeads = useCallback((): OfflineLead[] => {
    return leads.filter(lead => lead._isDirty);
  }, [leads]);

  return {
    leads,
    loading,
    error: error || (serverError ? serverError.message : null),
    isOnline,
    isSyncing,
    pendingCount,
    
    createLead,
    updateLead,
    deleteLead,
    
    syncNow,
    refreshFromServer,
    
    getLeadById,
    getLeadsByStatus,
    getDirtyLeads
  };
}

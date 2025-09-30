// src/lib/hooks/useOfflineTimeClock.ts
import { useState, useEffect, useCallback } from 'react';
import { offlineDB, OfflineTimesheet } from '../offline-db';
import { syncEngine } from '../sync-engine';
import { useMe } from '../useMe';

/**
 * ⏰ OFFLINE-FIRST TIME CLOCK HOOK
 * 
 * This hook provides offline-first time tracking with:
 * - Clock in/out functionality that works offline
 * - Automatic sync when connection is restored
 * - Location tracking (optional)
 * - Break time management
 * - Timesheet history
 */

interface UseOfflineTimeClockOptions {
  enableLocationTracking?: boolean;
  autoSync?: boolean;
}

interface TimeClockSession {
  id: string;
  clockIn: string;
  clockOut?: string;
  breakDuration?: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  isActive: boolean;
}

interface UseOfflineTimeClockReturn {
  // Current session
  currentSession: TimeClockSession | null;
  isClocked: boolean;
  sessionDuration: number; // in minutes
  
  // History
  todayTimesheets: OfflineTimesheet[];
  weekTimesheets: OfflineTimesheet[];
  totalHoursToday: number;
  totalHoursWeek: number;
  
  // Status
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  
  // Actions
  clockIn: (workOrderId?: string, notes?: string) => Promise<void>;
  clockOut: (notes?: string) => Promise<void>;
  addBreak: (minutes: number) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  
  // Sync
  syncNow: () => Promise<void>;
  
  // Utility
  formatDuration: (minutes: number) => string;
  getTimesheetById: (id: string) => OfflineTimesheet | undefined;
}

export function useOfflineTimeClock(options: UseOfflineTimeClockOptions = {}): UseOfflineTimeClockReturn {
  const { me } = useMe();
  const [currentSession, setCurrentSession] = useState<TimeClockSession | null>(null);
  const [todayTimesheets, setTodayTimesheets] = useState<OfflineTimesheet[]>([]);
  const [weekTimesheets, setWeekTimesheets] = useState<OfflineTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  const userId = me?.id;
  const orgId = me?.orgId;

  // Load timesheets from local database
  const loadTimesheets = useCallback(async () => {
    if (!userId || !orgId) return;
    
    try {
      setLoading(true);
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000)).toISOString();
      
      // Load today's timesheets
      const today = await offlineDB.timesheets
        .where('userId')
        .equals(userId)
        .and(timesheet => 
          timesheet.orgId === orgId && 
          timesheet.clockIn >= todayStart &&
          !timesheet._isDeleted
        )
        .toArray();
      
      // Load this week's timesheets
      const week = await offlineDB.timesheets
        .where('userId')
        .equals(userId)
        .and(timesheet => 
          timesheet.orgId === orgId && 
          timesheet.clockIn >= weekStart &&
          !timesheet._isDeleted
        )
        .toArray();
      
      setTodayTimesheets(today);
      setWeekTimesheets(week);
      
      // Check for active session (clocked in but not out)
      const activeSession = today.find(t => !t.clockOut);
      if (activeSession) {
        setCurrentSession({
          id: activeSession.id,
          clockIn: activeSession.clockIn,
          clockOut: activeSession.clockOut,
          breakDuration: activeSession.breakDuration,
          location: activeSession.location,
          isActive: true
        });
      } else {
        setCurrentSession(null);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  }, [userId, orgId]);

  // Update session duration
  useEffect(() => {
    if (!currentSession) {
      setSessionDuration(0);
      return;
    }

    const updateDuration = () => {
      const clockInTime = new Date(currentSession.clockIn).getTime();
      const now = Date.now();
      const duration = Math.floor((now - clockInTime) / (1000 * 60)); // minutes
      const breakTime = currentSession.breakDuration || 0;
      setSessionDuration(Math.max(0, duration - breakTime));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [currentSession]);

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

  // Get current location if enabled
  const getCurrentLocation = useCallback(async (): Promise<{ latitude: number; longitude: number; accuracy: number } | undefined> => {
    if (typeof window === 'undefined' || !options.enableLocationTracking || !navigator.geolocation) {
      return undefined;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.warn('Location access denied or failed:', error);
          resolve(undefined);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, [options.enableLocationTracking]);

  // Initialize
  useEffect(() => {
    loadTimesheets();
    updateSyncStatus();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [loadTimesheets, updateSyncStatus]);

  // Clock in
  const clockIn = useCallback(async (workOrderId?: string, notes?: string): Promise<void> => {
    if (!userId || !orgId) throw new Error('User not authenticated');
    if (currentSession) throw new Error('Already clocked in');
    
    try {
      const now = new Date().toISOString();
      const location = await getCurrentLocation();
      const timesheetId = crypto.randomUUID();
      
      const timesheet: OfflineTimesheet = {
        id: timesheetId,
        orgId,
        userId,
        workOrderId,
        clockIn: now,
        notes,
        location,
        createdAt: now,
        updatedAt: now,
        _localId: timesheetId,
        _isDirty: true
      };

      // Add to local database
      await offlineDB.timesheets.add(timesheet);
      
      // Queue for sync
      await syncEngine.enqueueOperation(
        '/api/timesheets',
        'POST',
        {
          workOrderId,
          clockIn: now,
          notes,
          location
        },
        orgId,
        'timesheet',
        undefined,
        timesheetId
      );

      // Reload timesheets
      await loadTimesheets();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in');
      throw err;
    }
  }, [userId, orgId, currentSession, getCurrentLocation, loadTimesheets]);

  // Clock out
  const clockOut = useCallback(async (notes?: string): Promise<void> => {
    if (!currentSession) throw new Error('Not clocked in');
    
    try {
      const now = new Date().toISOString();
      const location = await getCurrentLocation();
      
      // Update local database
      await offlineDB.timesheets.update(currentSession.id, {
        clockOut: now,
        notes: notes || undefined,
        location: location || currentSession.location,
        updatedAt: now,
        _isDirty: true,
        _lastSyncAt: undefined
      });
      
      // Queue for sync
      await syncEngine.enqueueOperation(
        `/api/timesheets/${currentSession.id}`,
        'PATCH',
        {
          clockOut: now,
          notes,
          location
        },
        orgId!,
        'timesheet',
        currentSession.id
      );

      // Reload timesheets
      await loadTimesheets();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out');
      throw err;
    }
  }, [currentSession, getCurrentLocation, loadTimesheets, orgId]);

  // Add break time
  const addBreak = useCallback(async (minutes: number): Promise<void> => {
    if (!currentSession) throw new Error('Not clocked in');
    
    try {
      const currentBreak = currentSession.breakDuration || 0;
      const newBreakDuration = currentBreak + minutes;
      
      // Update local database
      await offlineDB.timesheets.update(currentSession.id, {
        breakDuration: newBreakDuration,
        updatedAt: new Date().toISOString(),
        _isDirty: true,
        _lastSyncAt: undefined
      });
      
      // Queue for sync
      await syncEngine.enqueueOperation(
        `/api/timesheets/${currentSession.id}`,
        'PATCH',
        {
          breakDuration: newBreakDuration
        },
        orgId!,
        'timesheet',
        currentSession.id
      );

      // Reload timesheets
      await loadTimesheets();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add break');
      throw err;
    }
  }, [currentSession, loadTimesheets, orgId]);

  // Update notes
  const updateNotes = useCallback(async (notes: string): Promise<void> => {
    if (!currentSession) throw new Error('Not clocked in');
    
    try {
      // Update local database
      await offlineDB.timesheets.update(currentSession.id, {
        notes,
        updatedAt: new Date().toISOString(),
        _isDirty: true,
        _lastSyncAt: undefined
      });
      
      // Queue for sync
      await syncEngine.enqueueOperation(
        `/api/timesheets/${currentSession.id}`,
        'PATCH',
        { notes },
        orgId!,
        'timesheet',
        currentSession.id
      );

      // Reload timesheets
      await loadTimesheets();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
      throw err;
    }
  }, [currentSession, loadTimesheets, orgId]);

  // Sync now
  const syncNow = useCallback(async (): Promise<void> => {
    try {
      setIsSyncing(true);
      await syncEngine.forceSyncAll();
      await loadTimesheets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [loadTimesheets]);

  // Utility functions
  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }, []);

  const getTimesheetById = useCallback((id: string): OfflineTimesheet | undefined => {
    return [...todayTimesheets, ...weekTimesheets].find(t => t.id === id);
  }, [todayTimesheets, weekTimesheets]);

  // Calculate totals
  const totalHoursToday = todayTimesheets.reduce((total, timesheet) => {
    if (!timesheet.clockOut) return total;
    const clockIn = new Date(timesheet.clockIn).getTime();
    const clockOut = new Date(timesheet.clockOut).getTime();
    const duration = (clockOut - clockIn) / (1000 * 60); // minutes
    const breakTime = timesheet.breakDuration || 0;
    return total + Math.max(0, duration - breakTime);
  }, 0);

  const totalHoursWeek = weekTimesheets.reduce((total, timesheet) => {
    if (!timesheet.clockOut) return total;
    const clockIn = new Date(timesheet.clockIn).getTime();
    const clockOut = new Date(timesheet.clockOut).getTime();
    const duration = (clockOut - clockIn) / (1000 * 60); // minutes
    const breakTime = timesheet.breakDuration || 0;
    return total + Math.max(0, duration - breakTime);
  }, 0);

  return {
    currentSession,
    isClocked: !!currentSession,
    sessionDuration,
    
    todayTimesheets,
    weekTimesheets,
    totalHoursToday,
    totalHoursWeek,
    
    loading,
    error,
    isOnline,
    isSyncing,
    pendingCount,
    
    clockIn,
    clockOut,
    addBreak,
    updateNotes,
    
    syncNow,
    
    formatDuration,
    getTimesheetById
  };
}

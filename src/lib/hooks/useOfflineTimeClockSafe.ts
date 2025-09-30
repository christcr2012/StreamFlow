/**
 * SSR-Safe Offline Time Clock Hook
 * 
 * This is a drop-in replacement for useOfflineTimeClock that:
 * 1. Works during SSR (returns safe defaults)
 * 2. Lazy-loads Dexie only in browser
 * 3. Provides same API as original hook
 */

import { useState, useEffect, useCallback } from 'react';
import { useMe } from '../useMe';
import { isOfflineDBAvailable, withOfflineDB } from '../offline/lazy-db';

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

interface OfflineTimesheet {
  id: string;
  orgId: string;
  employeeId: string;
  clockInAt: string;
  clockOutAt?: string;
  breakDuration?: number;
  location?: any;
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: string;
  updatedAt: string;
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
  clockIn: (location?: { latitude: number; longitude: number; accuracy: number }) => Promise<void>;
  clockOut: () => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  syncNow: () => Promise<void>;
  
  // Utilities
  formatDuration: (minutes: number) => string;
}

export function useOfflineTimeClockSafe(
  options: UseOfflineTimeClockOptions = {}
): UseOfflineTimeClockReturn {
  const { enableLocationTracking = false, autoSync = true } = options;
  const { me } = useMe();

  // State
  const [currentSession, setCurrentSession] = useState<TimeClockSession | null>(null);
  const [todayTimesheets, setTodayTimesheets] = useState<OfflineTimesheet[]>([]);
  const [weekTimesheets, setWeekTimesheets] = useState<OfflineTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Check if offline features are available
  const offlineAvailable = isOfflineDBAvailable();

  // Load current session and timesheets
  useEffect(() => {
    if (!offlineAvailable || !me) {
      setLoading(false);
      return;
    }

    loadData();
  }, [offlineAvailable, me]);

  const loadData = async () => {
    if (!me) return;

    try {
      setLoading(true);

      // Load current session
      const session = await withOfflineDB(async (db) => {
        const timesheets = await db.timesheets
          .where('employeeId')
          .equals(me.id)
          .and((t: any) => !t.clockOutAt)
          .toArray();

        return timesheets[0] || null;
      });

      if (session) {
        setCurrentSession({
          id: session.id,
          clockIn: session.clockInAt,
          clockOut: session.clockOutAt,
          breakDuration: session.breakDuration,
          location: session.location,
          isActive: !session.clockOutAt
        });
      }

      // Load today's timesheets
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySheets = await withOfflineDB(async (db) => {
        return await db.timesheets
          .where('employeeId')
          .equals(me.id)
          .and((t: any) => new Date(t.clockInAt) >= today)
          .toArray();
      });

      setTodayTimesheets(todaySheets || []);

      // Load week's timesheets
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const weekSheets = await withOfflineDB(async (db) => {
        return await db.timesheets
          .where('employeeId')
          .equals(me.id)
          .and((t: any) => new Date(t.clockInAt) >= weekStart)
          .toArray();
      });

      setWeekTimesheets(weekSheets || []);

      // Load pending count
      const pending = await withOfflineDB(async (db) => {
        return await db.pending.count();
      });

      setPendingCount(pending || 0);

      setError(null);
    } catch (err) {
      console.error('Failed to load time clock data:', err);
      setError('Failed to load time clock data');
    } finally {
      setLoading(false);
    }
  };

  // Clock in
  const clockIn = useCallback(async (location?: { latitude: number; longitude: number; accuracy: number }) => {
    if (!me || !offlineAvailable) {
      setError('Offline features not available');
      return;
    }

    try {
      const now = new Date().toISOString();
      const timesheetId = `ts_${Date.now()}_${me.id}`;

      await withOfflineDB(async (db) => {
        await db.timesheets.add({
          id: timesheetId,
          orgId: me.orgId,
          employeeId: me.id,
          clockInAt: now,
          clockOutAt: undefined,
          breakDuration: 0,
          location: location || undefined,
          syncStatus: 'pending',
          createdAt: now,
          updatedAt: now
        });

        // Queue sync operation
        await db.pending.add({
          route: '/api/timesheets',
          method: 'POST',
          payload: {
            employeeId: me.id,
            clockInAt: now,
            location
          },
          orgId: me.orgId,
          idemKey: timesheetId,
          createdAt: now
        });
      });

      setCurrentSession({
        id: timesheetId,
        clockIn: now,
        isActive: true,
        location
      });

      await loadData();
    } catch (err) {
      console.error('Clock in failed:', err);
      setError('Failed to clock in');
    }
  }, [me, offlineAvailable]);

  // Clock out
  const clockOut = useCallback(async () => {
    if (!me || !currentSession || !offlineAvailable) {
      setError('No active session');
      return;
    }

    try {
      const now = new Date().toISOString();

      await withOfflineDB(async (db) => {
        await db.timesheets.update(currentSession.id, {
          clockOutAt: now,
          updatedAt: now,
          syncStatus: 'pending'
        });

        // Queue sync operation
        await db.pending.add({
          route: `/api/timesheets/${currentSession.id}`,
          method: 'PATCH',
          payload: {
            clockOutAt: now
          },
          orgId: me.orgId,
          idemKey: `${currentSession.id}_out`,
          createdAt: now
        });
      });

      setCurrentSession(null);
      await loadData();
    } catch (err) {
      console.error('Clock out failed:', err);
      setError('Failed to clock out');
    }
  }, [me, currentSession, offlineAvailable]);

  // Stub implementations for break management
  const startBreak = useCallback(async () => {
    console.log('Break management not yet implemented');
  }, []);

  const endBreak = useCallback(async () => {
    console.log('Break management not yet implemented');
  }, []);

  // Sync now
  const syncNow = useCallback(async () => {
    if (!offlineAvailable) return;

    setIsSyncing(true);
    try {
      // TODO: Implement sync logic
      console.log('Sync not yet implemented');
      await loadData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [offlineAvailable]);

  // Format duration
  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }, []);

  // Calculate totals
  const totalHoursToday = todayTimesheets.reduce((total, ts) => {
    if (!ts.clockOutAt) return total;
    const duration = new Date(ts.clockOutAt).getTime() - new Date(ts.clockInAt).getTime();
    return total + duration / (1000 * 60); // Convert to minutes
  }, 0);

  const totalHoursWeek = weekTimesheets.reduce((total, ts) => {
    if (!ts.clockOutAt) return total;
    const duration = new Date(ts.clockOutAt).getTime() - new Date(ts.clockInAt).getTime();
    return total + duration / (1000 * 60); // Convert to minutes
  }, 0);

  const sessionDuration = currentSession
    ? Math.floor((Date.now() - new Date(currentSession.clockIn).getTime()) / (1000 * 60))
    : 0;

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, syncNow]);

  return {
    currentSession,
    isClocked: !!currentSession,
    sessionDuration,
    todayTimesheets,
    weekTimesheets,
    totalHoursToday,
    totalHoursWeek: totalHoursWeek,
    loading,
    error,
    isOnline,
    isSyncing,
    pendingCount,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    syncNow,
    formatDuration
  };
}


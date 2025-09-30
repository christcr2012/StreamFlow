/**
 * Module: Offline Banner
 * Purpose: Display offline status and pending sync count
 * Scope: Client-side UI component
 * Notes: Codex Phase 5 - Offline banner with sync status
 */

import { useState, useEffect } from 'react';
import { usePendingCount, useReplayQueue, isOnline } from '@/lib/offline/sync';

interface OfflineBannerProps {
  orgId: string | null;
}

export default function OfflineBanner({ orgId }: OfflineBannerProps) {
  const [online, setOnline] = useState(isOnline());
  const { count, loading } = usePendingCount(orgId);
  const { replay, isReplaying, lastResult } = useReplayQueue(orgId);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Don't show banner if online and no pending items
  if (online && count === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Offline Banner */}
      {!online && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <span>You're offline. Changes will sync when you reconnect.</span>
            {!loading && count > 0 && (
              <span className="ml-2 bg-yellow-600 px-2 py-0.5 rounded-full text-xs">
                {count} pending
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pending Sync Banner (when online but have pending items) */}
      {online && count > 0 && (
        <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-3">
            <svg
              className={`w-5 h-5 ${isReplaying ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>
              {isReplaying
                ? 'Syncing changes...'
                : `${count} change${count === 1 ? '' : 's'} waiting to sync`}
            </span>
            {!isReplaying && (
              <button
                onClick={replay}
                className="ml-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-semibold transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
          
          {/* Show last sync result */}
          {lastResult && !isReplaying && (
            <div className="mt-1 text-xs opacity-90">
              Last sync: {lastResult.success} succeeded
              {lastResult.failed > 0 && `, ${lastResult.failed} failed`}
              {lastResult.skipped > 0 && `, ${lastResult.skipped} skipped`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact offline indicator for use in navigation
 */
export function OfflineIndicator({ orgId }: OfflineBannerProps) {
  const [online, setOnline] = useState(isOnline());
  const { count } = usePendingCount(orgId);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (online && count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {!online && (
        <div className="flex items-center gap-1 text-yellow-600 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Offline</span>
        </div>
      )}
      
      {count > 0 && (
        <div className="flex items-center gap-1 text-blue-600 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          <span>{count} pending</span>
        </div>
      )}
    </div>
  );
}

// PR-CHECKS:
// - [x] Offline banner component
// - [x] Shows offline status
// - [x] Shows pending sync count
// - [x] Manual sync trigger
// - [x] Sync result display
// - [x] Compact indicator variant


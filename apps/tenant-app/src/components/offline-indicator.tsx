'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOffline, useActionQueue } from '@/hooks/use-offline';

/**
 * Offline Indicator Component
 * 
 * Displays connection status and queued actions:
 * - Shows banner when offline
 * - Shows success message when connection restored
 * - Displays count of queued actions
 * - Auto-hides after connection restored
 * - Spring physics animations
 * - Dark mode support
 */
export function OfflineIndicator() {
  const { isOnline, isOffline, wasOffline, resetWasOffline } = useOffline();
  const { queuedCount } = useActionQueue();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowOnlineMessage(true);
      
      // Hide online message after 3 seconds
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
        resetWasOffline();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  return (
    <>
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-3 shadow-lg"
          >
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
                <div>
                  <p className="font-semibold">You are offline</p>
                  <p className="text-sm opacity-90">
                    {queuedCount > 0 
                      ? `${queuedCount} action${queuedCount > 1 ? 's' : ''} queued for sync`
                      : 'Changes will be saved when connection is restored'
                    }
                  </p>
                </div>
              </div>
              
              {queuedCount > 0 && (
                <div className="bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold">
                  {queuedCount} queued
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Success Message */}
      <AnimatePresence>
        {showOnlineMessage && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-green-500 dark:bg-green-600 text-white px-4 py-3 shadow-lg"
          >
            <div className="container mx-auto flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Connection restored</p>
                {queuedCount > 0 && (
                  <p className="text-sm opacity-90">Syncing {queuedCount} queued action{queuedCount > 1 ? 's' : ''}...</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Offline Toast Component
 * 
 * Compact toast notification for offline status
 */
export function OfflineToast() {
  const { isOffline } = useOffline();
  const { queuedCount } = useActionQueue();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 right-4 z-50 bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm"
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-sm">Offline Mode</p>
              {queuedCount > 0 && (
                <p className="text-xs opacity-90 mt-1">
                  {queuedCount} action{queuedCount > 1 ? 's' : ''} queued
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


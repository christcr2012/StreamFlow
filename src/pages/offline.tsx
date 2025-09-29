// src/pages/offline.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * 📱 OFFLINE FALLBACK PAGE
 * 
 * This page is shown when the user is offline and tries to navigate
 * to a page that isn't cached. It provides:
 * - Clear offline status indication
 * - Retry mechanism when connection is restored
 * - Cached data access for critical workflows
 * - Progressive enhancement for offline-first experience
 */

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-retry when connection is restored
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Test connectivity with a simple fetch
      await fetch('/api/_health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      // If successful, reload the page
      window.location.reload();
    } catch (error) {
      // Still offline, show feedback
      setTimeout(() => {
        setIsRetrying(false);
      }, 2000);
    }
  };

  const goToCachedDashboard = () => {
    // Navigate to dashboard which should be cached
    window.location.href = '/dashboard';
  };

  const goToCachedLeads = () => {
    // Navigate to leads which should be cached
    window.location.href = '/leads';
  };

  return (
    <>
      <Head>
        <title>StreamFlow - Offline</title>
        <meta name="description" content="StreamFlow is currently offline. Some features may be limited." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Offline Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-slate-800 mb-6">
            <WifiIcon className={`h-10 w-10 ${isOnline ? 'text-green-400' : 'text-slate-400'}`} />
          </div>

          {/* Status Message */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </h1>
          
          <p className="text-slate-300 mb-8">
            {isOnline 
              ? 'Your connection has been restored. Refreshing...'
              : 'No internet connection detected. You can still access cached data and work offline.'
            }
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            {!isOnline && (
              <>
                {/* Retry Button */}
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRetrying ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Checking Connection...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="-ml-1 mr-3 h-5 w-5" />
                      Try Again
                    </>
                  )}
                </button>

                {/* Cached Content Access */}
                <div className="border-t border-slate-700 pt-6">
                  <p className="text-sm text-slate-400 mb-4">
                    Access cached content:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={goToCachedDashboard}
                      className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                    >
                      Dashboard
                    </button>
                    
                    <button
                      onClick={goToCachedLeads}
                      className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                    >
                      Leads
                    </button>
                  </div>
                </div>

                {/* Offline Features Info */}
                <div className="mt-8 p-4 bg-slate-800 rounded-lg text-left">
                  <h3 className="text-sm font-medium text-white mb-2">
                    Available Offline:
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• View cached leads and work orders</li>
                    <li>• Clock in/out (syncs when online)</li>
                    <li>• Create new leads (syncs when online)</li>
                    <li>• Update work order status</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Connection Status Indicator */}
          <div className="mt-8 flex items-center justify-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs text-slate-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// This page should not require authentication since it's a fallback
OfflinePage.requireAuth = false;

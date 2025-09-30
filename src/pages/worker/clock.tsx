// src/pages/worker/clock.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
// TODO: Re-enable offline time clock after fixing SSR issues with Dexie
// import { useOfflineTimeClock } from "@/lib/hooks/useOfflineTimeClock";
import { OfflineIndicator } from "@/components/OfflineBanner";

/**
 * Employee Time Clock with Geolocation
 * Mobile-first PWA design for field workers
 * Features: GPS-based clock in/out, real-time location tracking, shift timer
 * Codex Phase 5: Now uses offline-first time clock hook
 *
 * TEMPORARY: Offline features disabled due to SSR build issues with Dexie/IndexedDB
 */
function WorkerClock() {
  const { me, loading, error } = useMe();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  // TODO: Re-enable offline time clock after fixing SSR issues
  // Codex Phase 5: Use offline-first time clock hook
  const currentSession: any = null;
  const isClocked = false;
  const sessionDuration = 0;
  const totalHoursToday = 0;
  const isOnline = true;
  const isSyncing = false;
  const pendingCount = 0;
  const clockIn = async () => { console.log('Clock in - offline mode disabled'); };
  const clockOut = async () => { console.log('Clock out - offline mode disabled'); };
  const formatDuration = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
  const clockError: string | null = null;

  // const {
  //   currentSession,
  //   isClocked,
  //   sessionDuration,
  //   totalHoursToday,
  //   isOnline,
  //   isSyncing,
  //   pendingCount,
  //   clockIn,
  //   clockOut,
  //   formatDuration,
  //   error: clockError,
  // } = useOfflineTimeClock({ enableLocationTracking: true, autoSync: true });

  // Redirect non-STAFF users
  useEffect(() => {
    if (!loading && me && me.role !== "STAFF") {
      router.push("/dashboard");
    }
  }, [me, loading, router]);

  // Update time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Codex Phase 5: Handle clock in/out with offline support
  const handleClockAction = async () => {
    try {
      if (isClocked) {
        await clockOut();
      } else {
        await clockIn();
      }
    } catch (error) {
      console.error('Clock action failed:', error);
      alert(clockError || 'Failed to process clock action. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !me || me.role !== "STAFF") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">Employee access required</p>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Indicator - Codex Phase 5 */}
      <OfflineIndicator orgId={me?.orgId || null} />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Time Clock</h1>
          <p className="text-green-100 text-lg font-semibold">
            {currentTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}
          </p>
          <p className="text-green-100 text-sm">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          {/* Offline/Sync Status */}
          {!isOnline && (
            <div className="mt-2 bg-yellow-500 text-yellow-900 px-3 py-1 rounded text-sm">
              ⚠️ Offline - Changes will sync when online
            </div>
          )}
          {isSyncing && (
            <div className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">
              🔄 Syncing {pendingCount} changes...
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">

          {/* Clock Status Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${isClocked ? 'text-green-500' : 'text-gray-400'}`}>
                {isClocked ? '🟢' : '⭕'}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isClocked ? 'Clocked In' : 'Clocked Out'}
              </h2>
              {isClocked && currentSession && (
                <div className="text-gray-600">
                  <p>Started at {new Date(currentSession.clockIn).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatDuration(sessionDuration)}
                  </p>
                  {currentSession.location && (
                    <p className="text-xs text-gray-400 mt-2">
                      📍 {currentSession.location.latitude.toFixed(4)}, {currentSession.location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Today's Hours */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Today's Hours</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatDuration(totalHoursToday)}
            </p>
          </div>

          {/* Clock Action Button */}
          <button
            onClick={handleClockAction}
            disabled={isSyncing}
            className={`w-full py-4 px-6 rounded-lg font-bold text-xl transition-all ${
              isClocked
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } ${
              isSyncing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSyncing
              ? 'Syncing...'
              : isClocked
              ? 'Clock Out'
              : 'Clock In'
            }
          </button>

          {clockError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {clockError}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 text-center">
            <Link href="/worker/home" className="text-blue-500 underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerClock;
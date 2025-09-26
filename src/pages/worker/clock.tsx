// src/pages/worker/clock.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface ClockStatus {
  isClockedIn: boolean;
  clockInTime?: Date;
  currentShiftHours?: number;
  location?: GeolocationData;
}

/**
 * Employee Time Clock with Geolocation
 * Mobile-first PWA design for field workers
 * Features: GPS-based clock in/out, real-time location tracking, shift timer
 */
export default function WorkerClock() {
  const { me, loading, error } = useMe();
  const router = useRouter();
  const [clockStatus, setClockStatus] = useState<ClockStatus>({ isClockedIn: false });
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Redirect non-STAFF users (temporarily disabled for testing)
  // useEffect(() => {
  //   if (!loading && me && me.role !== "STAFF") {
  //     router.push("/dashboard");
  //   }
  // }, [me, loading, router]);

  // Update time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get current location
  useEffect(() => {
    if (me && me.role === "STAFF") {
      getCurrentLocation();
    }
  }, [me]);

  // TODO: Load current clock status from API
  useEffect(() => {
    if (me) {
      // Mock data for now - will integrate with actual API later
      setClockStatus({
        isClockedIn: false, // This should come from API
        clockInTime: undefined,
        currentShiftHours: 0
      });
    }
  }, [me]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this device");
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoData: GeolocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        setLocation(geoData);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location services.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleClockAction = async () => {
    if (!location && !locationError) {
      setLocationError("Getting location...");
      getCurrentLocation();
      return;
    }

    setIsProcessing(true);
    
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/worker/timeclock', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     action: clockStatus.isClockedIn ? 'clock_out' : 'clock_in',
      //     location: location,
      //     timestamp: new Date().toISOString()
      //   })
      // });

      // Mock API response for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (clockStatus.isClockedIn) {
        // Clock out
        setClockStatus({
          isClockedIn: false,
          clockInTime: undefined,
          currentShiftHours: 0
        });
      } else {
        // Clock in
        setClockStatus({
          isClockedIn: true,
          clockInTime: new Date(),
          currentShiftHours: 0,
          location: location || undefined
        });
      }
    } catch (error) {
      console.error('Clock action failed:', error);
      setLocationError('Failed to process clock action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Role check temporarily disabled for testing
  // if (error || !me || me.role !== "STAFF") {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center p-4">
  //       <div className="text-center">
  //         <p className="text-red-500 mb-4">Employee access required</p>
  //         <Link href="/login" className="btn-primary">
  //           Sign In
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-background">
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
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          
          {/* Clock Status Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${clockStatus.isClockedIn ? 'text-green-500' : 'text-gray-400'}`}>
                {clockStatus.isClockedIn ? '🟢' : '⭕'}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {clockStatus.isClockedIn ? 'Clocked In' : 'Clocked Out'}
              </h2>
              {clockStatus.isClockedIn && clockStatus.clockInTime && (
                <div className="text-gray-600">
                  <p>Started at {clockStatus.clockInTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {Math.floor((Date.now() - clockStatus.clockInTime.getTime()) / 1000 / 60)} minutes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location Status */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              📍 Location Status
            </h3>
            {locationError ? (
              <div className="text-red-500 text-sm">
                <p>{locationError}</p>
                <button
                  onClick={getCurrentLocation}
                  className="mt-2 text-blue-500 underline"
                >
                  Try Again
                </button>
              </div>
            ) : location ? (
              <div className="text-sm text-gray-600">
                <p>✅ Location verified</p>
                <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
                <p className="text-xs text-gray-400 mt-1">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                <p>📡 Getting location...</p>
              </div>
            )}
          </div>

          {/* Clock Action Button */}
          <button
            onClick={handleClockAction}
            disabled={isProcessing || (!location && !locationError)}
            className={`w-full py-4 px-6 rounded-lg font-bold text-xl transition-all ${
              clockStatus.isClockedIn
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } ${
              (isProcessing || (!location && !locationError))
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isProcessing
              ? 'Processing...'
              : clockStatus.isClockedIn
              ? 'Clock Out'
              : 'Clock In'
            }
          </button>

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
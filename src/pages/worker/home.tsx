// src/pages/worker/home.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  todayHours: number;
  weekHours: number;
  activeJobs: number;
  pendingTasks: number;
}

/**
 * Employee Portal Home Dashboard
 * Mobile-first PWA design for field workers
 * Features: Today's summary, quick actions, recent activity
 */
export default function WorkerHome() {
  const { me, loading, error } = useMe();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Redirect non-STAFF users
  useEffect(() => {
    if (!loading && me && me.role !== "STAFF") {
      router.push("/dashboard");
    }
  }, [me, loading, router]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // TODO: Load dashboard stats from API
  useEffect(() => {
    if (me) {
      // Mock data for now - will integrate with actual API later
      setStats({
        todayHours: 6.5,
        weekHours: 32.5,
        activeJobs: 3,
        pendingTasks: 7
      });
    }
  }, [me]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">Authentication required</p>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (me.role !== "STAFF") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-orange-500 mb-4">Employee portal access required</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 pb-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Good {getTimeOfDay()}, {me.name || 'Employee'}</h1>
          <p className="text-blue-100 text-sm">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-blue-100 text-lg font-semibold">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="px-4 -mt-4 mb-6">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Today's Hours</div>
            <div className="text-2xl font-bold text-green-600">
              {stats?.todayHours?.toFixed(1) || '0.0'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Week Total</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.weekHours?.toFixed(1) || '0.0'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600">Active Jobs</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.activeJobs || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600">Pending Tasks</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.pendingTasks || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/worker/clock" className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 text-center transition-colors">
              <div className="text-2xl mb-2">⏰</div>
              <div className="font-semibold">Clock In/Out</div>
            </Link>
            <Link href="/worker/jobs" className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 text-center transition-colors">
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold">My Jobs</div>
            </Link>
            <Link href="/worker/training" className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-4 text-center transition-colors">
              <div className="text-2xl mb-2">🎓</div>
              <div className="font-semibold">Training</div>
            </Link>
            <Link href="/worker/payroll" className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-4 text-center transition-colors">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold">Payroll</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity - Placeholder */}
      <div className="px-4 mb-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📱</div>
              <p>Activity tracking coming soon</p>
              <p className="text-sm">Clock in to start logging your work</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
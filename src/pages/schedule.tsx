// src/pages/schedule.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Schedule Management Page
 * Placeholder page for scheduling and calendar management
 */
export default function Schedule() {
  const { me, loading, error } = useMe();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && (!me || error)) {
      router.push("/login");
    }
  }, [me, loading, error, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!me) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Schedule</h1>
        <p className="text-gray-600">Manage employee schedules and appointments</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h2 className="text-2xl font-bold mb-4">Schedule Management</h2>
        <p className="text-gray-600 mb-6">
          This feature is coming soon! You'll be able to manage employee schedules, 
          customer appointments, and resource allocation.
        </p>
        <div className="text-sm text-gray-500">
          Features will include: Calendar view, appointment booking, 
          employee scheduling, and conflict resolution.
        </div>
      </div>
    </div>
  );
}
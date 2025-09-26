// src/pages/jobs.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Jobs Management Page
 * Placeholder page for job scheduling and management
 */
export default function Jobs() {
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
        <h1 className="text-3xl font-bold mb-2">Jobs</h1>
        <p className="text-gray-600">Manage customer jobs and work orders</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🔧</div>
        <h2 className="text-2xl font-bold mb-4">Jobs Management</h2>
        <p className="text-gray-600 mb-6">
          This feature is coming soon! You'll be able to manage customer jobs, 
          work orders, and track project progress.
        </p>
        <div className="text-sm text-gray-500">
          Features will include: Job scheduling, work order management, 
          progress tracking, and customer communication.
        </div>
      </div>
    </div>
  );
}
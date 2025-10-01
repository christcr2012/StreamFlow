// src/pages/customer/jobs.tsx
// Customer Job History Page
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface Job {
  id: string;
  serviceType: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        router.push('/customer/login');
        return;
      }

      // TODO: Create dedicated job history endpoint
      // For now, use dashboard data
      const response = await fetch('/api/customer/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load jobs');
      }

      const data = await response.json();
      setJobs(data.recentJobs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Job History - Customer Portal</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.push('/customer')}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Job History</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Jobs Yet</h2>
              <p className="text-gray-600 mb-6">You don't have any service jobs yet.</p>
              <button
                onClick={() => router.push('/customer/appointments/request')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Request Your First Appointment
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{job.serviceType}</h3>
                        <p className="text-sm text-gray-600 mt-1">Job ID: {job.id.slice(0, 8)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p className="text-gray-900 font-medium">{formatDate(job.createdAt)}</p>
                      </div>
                      {job.scheduledAt && (
                        <div>
                          <p className="text-gray-500">Scheduled</p>
                          <p className="text-gray-900 font-medium">{formatDate(job.scheduledAt)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Last Updated</p>
                        <p className="text-gray-900 font-medium">{formatDate(job.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}


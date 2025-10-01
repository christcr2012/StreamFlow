// src/pages/customer/index.tsx
// Customer Portal Dashboard
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface Job {
  id: string;
  serviceType: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
}

interface DashboardData {
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    orgName: string;
  };
  recentJobs: Job[];
  upcomingJobs: Job[];
  stats: {
    totalJobs: number;
    completedJobs: number;
  };
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        router.push('/customer/login');
        return;
      }

      const response = await fetch('/api/customer/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }

      const data = await response.json();
      setData(data);
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Customer Portal - {data.customer.orgName}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {data.customer.name || 'Customer'}
                </h1>
                <p className="text-gray-600">{data.customer.orgName}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('customer_token');
                  router.push('/customer/login');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Total Jobs</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.stats.totalJobs}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{data.stats.completedJobs}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Upcoming</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{data.upcomingJobs.length}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/customer/appointments/request')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Request Appointment
              </button>
              <button
                onClick={() => router.push('/customer/jobs')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                View All Jobs
              </button>
              <button
                onClick={() => router.push('/customer/feedback')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Give Feedback
              </button>
            </div>
          </div>

          {/* Upcoming Appointments */}
          {data.upcomingJobs.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
              <div className="space-y-4">
                {data.upcomingJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.serviceType}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(job.scheduledAt)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Jobs</h2>
            {data.recentJobs.length === 0 ? (
              <p className="text-gray-600">No jobs yet</p>
            ) : (
              <div className="space-y-4">
                {data.recentJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.serviceType}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Created: {formatDate(job.createdAt)}
                        </p>
                        {job.scheduledAt && (
                          <p className="text-sm text-gray-600">
                            Scheduled: {formatDate(job.scheduledAt)}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}


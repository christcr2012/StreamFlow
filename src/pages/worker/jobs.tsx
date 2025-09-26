// src/pages/worker/jobs.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

interface JobAssignment {
  id: string;
  jobTitle: string;
  customerName: string;
  jobSite: {
    address: string;
    city: string;
    state: string;
  };
  status: 'assigned' | 'in_progress' | 'completed' | 'paused';
  startTime?: Date;
  endTime?: Date;
  priority: 'low' | 'medium' | 'high';
  checklist: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  notes?: string;
}

/**
 * Employee Job Assignments
 * Mobile-first PWA design for field workers
 * Features: Job list, status updates, checklists, navigation assistance
 */
export default function WorkerJobs() {
  const { me, loading, error } = useMe();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobAssignment[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Redirect non-STAFF users (temporarily disabled for testing)
  // useEffect(() => {
  //   if (!loading && me && me.role !== "STAFF") {
  //     router.push("/dashboard");
  //   }
  // }, [me, loading, router]);

  // TODO: Load job assignments from API
  useEffect(() => {
    if (me && me.role === "STAFF") {
      loadJobAssignments();
    }
  }, [me]);

  const loadJobAssignments = async () => {
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/worker/jobs');
      // const jobData = await response.json();
      
      // Mock data for now - will integrate with actual API later
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockJobs: JobAssignment[] = [
        {
          id: '1',
          jobTitle: 'Office Building Cleaning',
          customerName: 'Tech Corp HQ',
          jobSite: {
            address: '123 Business Blvd',
            city: 'Denver',
            state: 'CO'
          },
          status: 'assigned',
          priority: 'high',
          checklist: [
            { id: '1', title: 'Vacuum all carpets', completed: false },
            { id: '2', title: 'Clean restrooms', completed: false },
            { id: '3', title: 'Empty trash bins', completed: false },
            { id: '4', title: 'Wipe down surfaces', completed: false }
          ],
          notes: 'Customer prefers eco-friendly products only'
        },
        {
          id: '2',
          jobTitle: 'Retail Store Deep Clean',
          customerName: 'Mountain Sports',
          jobSite: {
            address: '456 Main Street',
            city: 'Boulder',
            state: 'CO'
          },
          status: 'in_progress',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          priority: 'medium',
          checklist: [
            { id: '5', title: 'Floor mopping', completed: true },
            { id: '6', title: 'Window cleaning', completed: true },
            { id: '7', title: 'Dust inventory shelves', completed: false },
            { id: '8', title: 'Clean checkout area', completed: false }
          ]
        },
        {
          id: '3',
          jobTitle: 'Restaurant Kitchen Sanitization',
          customerName: 'Alpine Bistro',
          jobSite: {
            address: '789 Food Court',
            city: 'Aspen',
            state: 'CO'
          },
          status: 'completed',
          startTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          endTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          priority: 'high',
          checklist: [
            { id: '9', title: 'Sanitize prep surfaces', completed: true },
            { id: '10', title: 'Clean equipment', completed: true },
            { id: '11', title: 'Floor deep clean', completed: true },
            { id: '12', title: 'Waste disposal', completed: true }
          ]
        }
      ];
      
      setJobs(mockJobs);
    } catch (error) {
      console.error('Failed to load job assignments:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const getStatusColor = (status: JobAssignment['status']) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: JobAssignment['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCompletionPercentage = (checklist: JobAssignment['checklist']) => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  if (loading || loadingJobs) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Role check temporarily disabled for testing

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">My Jobs</h1>
          <p className="text-blue-100 text-sm">
            {jobs.length} assignments • {jobs.filter(j => j.status === 'assigned').length} pending
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          
          {jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No Jobs Assigned</h3>
              <p className="text-gray-600">Check back later for new assignments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-lg p-4">
                  {/* Job Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{job.jobTitle}</h3>
                      <p className="text-gray-600">{job.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {job.jobSite.address}, {job.jobSite.city}, {job.jobSite.state}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(job.priority)}`}>
                        {job.priority} priority
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{getCompletionPercentage(job.checklist)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${getCompletionPercentage(job.checklist)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Timing */}
                  {job.startTime && (
                    <div className="text-sm text-gray-600 mb-3">
                      Started: {job.startTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                      {job.endTime && (
                        <span className="ml-2">
                          • Completed: {job.endTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick Checklist Preview */}
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Tasks ({job.checklist.filter(c => c.completed).length}/{job.checklist.length})</p>
                    <div className="space-y-1">
                      {job.checklist.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center text-sm">
                          <span className={`mr-2 ${item.completed ? 'text-green-500' : 'text-gray-400'}`}>
                            {item.completed ? '✅' : '⭕'}
                          </span>
                          <span className={item.completed ? 'line-through text-gray-500' : ''}>
                            {item.title}
                          </span>
                        </div>
                      ))}
                      {job.checklist.length > 3 && (
                        <p className="text-xs text-gray-500 ml-6">
                          +{job.checklist.length - 3} more tasks
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {job.notes && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {job.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                      onClick={() => router.push(`/worker/jobs/${job.id}`)}
                    >
                      View Details
                    </button>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm font-medium transition-colors">
                      📍 Navigate
                    </button>
                  </div>
                </div>
              ))}
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
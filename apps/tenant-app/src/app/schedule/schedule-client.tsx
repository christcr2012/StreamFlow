// apps/tenant-app/src/app/schedule/schedule-client.tsx
// Scheduling Calendar & Dispatch UI - Phase 1 scaffold

'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
} from 'lucide-react';

interface ScheduleClientProps {
  orgId: string;
}

interface Job {
  id: string;
  publicId: string;
  title: string;
  customerName: string;
  customerPhone: string;
  address: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: number;
  status: string;
  priority: string;
  assignedToId: string | null;
  assignedToName: string | null;
  jobType: string;
  estimatedRevenue: number;
  notes: string;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  certifications: string[];
  color: string;
  available: boolean;
}

type ViewMode = 'day' | 'week' | 'month';

export function ScheduleClient({ orgId }: ScheduleClientProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentDate, viewMode]);

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, techsRes] = await Promise.all([
        fetch(`/api/schedule/jobs?startDate=${currentDate.toISOString()}`),
        fetch('/api/schedule/technicians'),
      ]);

      if (jobsRes.ok && techsRes.ok) {
        const jobsData = await jobsRes.json();
        const techsData = await techsRes.json();
        setJobs(jobsData.jobs || []);
        setTechnicians(techsData.technicians || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedule data:', error);
    } finally {
      setLoading(false);
    }
  }

  function navigateDate(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  }

  const unassignedJobs = jobs.filter((j) => !j.assignedToId);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-gray-500">Loading schedule...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule & Dispatch</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage job assignments and technician schedules
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Job
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 font-medium"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded capitalize font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Unassigned Jobs */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <h3 className="font-semibold text-gray-900 mb-3">Unassigned Jobs</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {unassignedJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>All jobs assigned!</p>
              </div>
            ) : (
              unassignedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-3 bg-white border-2 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                    selectedJob?.id === job.id ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-900">{job.publicId}</div>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        job.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-900 mb-1">{job.customerName}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(job.scheduledStart).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span>{job.duration} min</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{job.address}</div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <p className="text-xs text-gray-600">
              📌 Phase 1: Drag & drop will be enabled in Phase 2
            </p>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 overflow-auto bg-white p-6">
          {viewMode === 'week' && (
            <WeekView jobs={jobs} technicians={technicians} onJobClick={setSelectedJob} />
          )}
          {viewMode === 'day' && (
            <DayView jobs={jobs} technicians={technicians} onJobClick={setSelectedJob} />
          )}
          {viewMode === 'month' && (
            <MonthView jobs={jobs} onJobClick={setSelectedJob} />
          )}
        </div>

        {/* Right Sidebar: Job Details */}
        {selectedJob && (
          <div className="w-96 border-l bg-white p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Job ID</div>
                <div className="text-lg font-semibold">{selectedJob.publicId}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Customer</div>
                <div className="font-medium">{selectedJob.customerName}</div>
                <div className="text-sm text-gray-600">{selectedJob.customerPhone}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Address</div>
                <div className="text-sm">{selectedJob.address}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Scheduled</div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {new Date(selectedJob.scheduledStart).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Duration: {selectedJob.duration} minutes
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Assigned To</div>
                <div className="text-sm">
                  {selectedJob.assignedToName || (
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Job Type</div>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {selectedJob.jobType}
                </span>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Notes</div>
                <div className="text-sm text-gray-700">{selectedJob.notes}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Estimated Revenue
                </div>
                <div className="text-lg font-semibold text-green-600">
                  ${selectedJob.estimatedRevenue.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Reassign Technician
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Reschedule
              </button>
              <button className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                Cancel Job
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Week View Component
function WeekView({
  jobs,
  technicians,
  onJobClick,
}: {
  jobs: Job[];
  technicians: Technician[];
  onJobClick: (job: Job) => void;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-4">
        <div className="font-semibold text-gray-700">Technician</div>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {technicians.map((tech) => (
        <div key={tech.id} className="grid grid-cols-8 gap-4 min-h-[120px]">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tech.color }}
            />
            <div>
              <div className="font-medium text-sm">{tech.name}</div>
              <div className="text-xs text-gray-500">{tech.skills.join(', ')}</div>
            </div>
          </div>

          {[...Array(7)].map((_, dayIndex) => {
            const techJobs = jobs.filter((j) => j.assignedToId === tech.id);
            return (
              <div key={dayIndex} className="border rounded-lg p-2 bg-gray-50 space-y-1">
                {techJobs.slice(0, 2).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onJobClick(job)}
                    className="p-2 bg-white border rounded cursor-pointer hover:shadow-sm text-xs"
                    style={{ borderLeftColor: tech.color, borderLeftWidth: 3 }}
                  >
                    <div className="font-medium truncate">{job.customerName}</div>
                    <div className="text-gray-500">
                      {new Date(job.scheduledStart).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
                {techJobs.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{techJobs.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Day View Component
function DayView({
  jobs,
  technicians,
  onJobClick,
}: {
  jobs: Job[];
  technicians: Technician[];
  onJobClick: (job: Job) => void;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  return (
    <div className="grid grid-cols-[80px_1fr] gap-4">
      {/* Time column */}
      <div className="space-y-4">
        {hours.map((hour) => (
          <div key={hour} className="h-20 text-sm text-gray-600">
            {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
          </div>
        ))}
      </div>

      {/* Technicians columns */}
      <div className="grid grid-cols-3 gap-4">
        {technicians.map((tech) => (
          <div key={tech.id} className="space-y-2">
            <div className="sticky top-0 bg-white pb-2 border-b">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tech.color }}
                />
                <div className="font-medium text-sm">{tech.name}</div>
              </div>
            </div>
            <div className="space-y-2">
              {jobs
                .filter((j) => j.assignedToId === tech.id)
                .map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onJobClick(job)}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:shadow-md"
                  >
                    <div className="font-medium text-sm mb-1">{job.customerName}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(job.scheduledStart).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{job.duration} min</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Month View Component (Simple grid)
function MonthView({ jobs, onJobClick }: { jobs: Job[]; onJobClick: (job: Job) => void }) {
  return (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p className="text-gray-600 mb-2">Month view coming soon</p>
      <p className="text-sm text-gray-500">
        Phase 1 focuses on week and day views for job scheduling
      </p>
    </div>
  );
}

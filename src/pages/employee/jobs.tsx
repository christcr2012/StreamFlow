// src/pages/employee/jobs.tsx

/**
 * 📋 EMPLOYEE JOB MANAGEMENT
 * 
 * Comprehensive job management interface for field workers.
 * Mobile-optimized for on-the-go job tracking and updates.
 * 
 * FEATURES:
 * - Job assignment viewing and management
 * - Real-time status updates
 * - Photo documentation
 * - Geolocation check-in/out
 * - Time tracking per job
 * - Customer communication
 * - Parts and materials tracking
 * - Job completion reporting
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import EmployeeLayout from '@/components/EmployeeLayout';
import { 
  ClipboardDocumentListIcon,
  CameraIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface JobAssignment {
  id: string;
  customer: string;
  address: string;
  phone: string;
  type: 'maintenance' | 'repair' | 'installation' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold';
  scheduledTime: string;
  estimatedDuration: number;
  description: string;
  skills: string[];
  materials?: string[];
  notes?: string;
  photos?: string[];
  timeTracking?: {
    startTime?: string;
    endTime?: string;
    totalTime?: number;
  };
  location?: {
    lat: number;
    lng: number;
    checkedIn: boolean;
  };
}

export default function EmployeeJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobAssignment[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }

    // Load job assignments
    setJobs([
      {
        id: '1',
        customer: 'Johnson Residence',
        address: '123 Oak Street, Springfield',
        phone: '(555) 123-4567',
        type: 'maintenance',
        priority: 'medium',
        status: 'pending',
        scheduledTime: '9:00 AM',
        estimatedDuration: 120,
        description: 'Annual HVAC maintenance and filter replacement. Check all vents and ducts.',
        skills: ['HVAC', 'Maintenance'],
        materials: ['Air Filter 16x25x1', 'Cleaning Supplies', 'Lubricants'],
        notes: 'Customer prefers morning appointments. Dog on property - friendly.'
      },
      {
        id: '2',
        customer: 'Downtown Office Complex',
        address: '456 Business Ave, Springfield',
        phone: '(555) 987-6543',
        type: 'repair',
        priority: 'high',
        status: 'pending',
        scheduledTime: '1:00 PM',
        estimatedDuration: 180,
        description: 'AC unit not cooling properly - diagnostic needed. Multiple complaints from tenants.',
        skills: ['HVAC', 'Diagnostics', 'Repair'],
        materials: ['Refrigerant R-410A', 'Diagnostic Tools', 'Replacement Parts TBD'],
        notes: 'Building manager: Sarah Chen. Access through main lobby.'
      },
      {
        id: '3',
        customer: 'Smith Family',
        address: '789 Maple Drive, Springfield',
        phone: '(555) 456-7890',
        type: 'installation',
        priority: 'medium',
        status: 'pending',
        scheduledTime: '4:00 PM',
        estimatedDuration: 240,
        description: 'Install new smart thermostat system with WiFi connectivity.',
        skills: ['Installation', 'Smart Systems', 'Electrical'],
        materials: ['Smart Thermostat', 'Wiring', 'Mounting Hardware'],
        notes: 'Customer wants training on app usage. Existing thermostat is very old.'
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'in-progress': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'on-hold': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const startJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            status: 'in-progress',
            timeTracking: {
              ...job.timeTracking,
              startTime: new Date().toISOString()
            }
          }
        : job
    ));
    setActiveTimer(jobId);
  };

  const completeJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            status: 'completed',
            timeTracking: {
              ...job.timeTracking,
              endTime: new Date().toISOString()
            }
          }
        : job
    ));
    setActiveTimer(null);
  };

  const checkInToJob = (jobId: string) => {
    if (!currentLocation) {
      alert('Location access required for check-in');
      return;
    }

    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            location: {
              lat: currentLocation.lat,
              lng: currentLocation.lng,
              checkedIn: true
            }
          }
        : job
    ));
  };

  const takePhoto = (jobId: string) => {
    // In a real app, this would open camera
    const photoUrl = `photo_${Date.now()}.jpg`;
    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            photos: [...(job.photos || []), photoUrl]
          }
        : job
    ));
  };

  const openJobDetails = (job: JobAssignment) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  return (
    <EmployeeLayout 
      title="My Jobs" 
      subtitle="Today's job assignments and progress tracking"
    >
      <div className="space-y-8">
        {/* Job List */}
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
              {/* Job Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{job.customer}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(job.status)}`}>
                      {job.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-1">{job.address}</p>
                  <p className="text-slate-300 text-sm">{job.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-medium">{job.scheduledTime}</div>
                  <div className="text-slate-400 text-sm">{job.estimatedDuration}min</div>
                </div>
              </div>

              {/* Job Actions */}
              <div className="flex flex-wrap gap-3 mb-4">
                {job.status === 'pending' && (
                  <button
                    onClick={() => startJob(job.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span>Start Job</span>
                  </button>
                )}

                {job.status === 'in-progress' && (
                  <button
                    onClick={() => completeJob(job.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Complete</span>
                  </button>
                )}

                <button
                  onClick={() => checkInToJob(job.id)}
                  disabled={job.location?.checkedIn}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    job.location?.checkedIn
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
                  }`}
                >
                  <MapPinIcon className="h-4 w-4" />
                  <span>{job.location?.checkedIn ? 'Checked In' : 'Check In'}</span>
                </button>

                <button
                  onClick={() => takePhoto(job.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  <CameraIcon className="h-4 w-4" />
                  <span>Photo ({job.photos?.length || 0})</span>
                </button>

                <button
                  onClick={() => window.open(`tel:${job.phone}`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <PhoneIcon className="h-4 w-4" />
                  <span>Call</span>
                </button>

                <button
                  onClick={() => openJobDetails(job)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-500/20 text-slate-400 rounded-lg hover:bg-slate-500/30 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Details</span>
                </button>
              </div>

              {/* Job Progress */}
              {job.status === 'in-progress' && activeTimer === job.id && (
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-400 font-medium">Job in Progress</span>
                    </div>
                    <div className="text-blue-400 font-mono">
                      {/* Timer would be implemented here */}
                      00:45:23
                    </div>
                  </div>
                </div>
              )}

              {/* Skills and Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {job.materials && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Materials Needed</h4>
                    <div className="space-y-1">
                      {job.materials.slice(0, 2).map((material, index) => (
                        <div key={index} className="text-slate-300 text-xs">• {material}</div>
                      ))}
                      {job.materials.length > 2 && (
                        <div className="text-slate-400 text-xs">+{job.materials.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {job.notes && (
                <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-yellow-400 text-sm font-medium mb-1">Important Notes</div>
                      <div className="text-slate-300 text-sm">{job.notes}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Job Details Modal */}
        {showJobDetails && selectedJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-green-500/20 p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Job Details</h2>
                <button
                  onClick={() => setShowJobDetails(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">{selectedJob.customer}</h3>
                  <p className="text-slate-400">{selectedJob.address}</p>
                  <p className="text-slate-400">{selectedJob.phone}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">Description</h4>
                  <p className="text-slate-300">{selectedJob.description}</p>
                </div>

                {selectedJob.materials && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Materials</h4>
                    <ul className="space-y-1">
                      {selectedJob.materials.map((material, index) => (
                        <li key={index} className="text-slate-300 text-sm">• {material}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJob.photos && selectedJob.photos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-2">Photos</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedJob.photos.map((photo, index) => (
                        <div key={index} className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center">
                          <CameraIcon className="h-8 w-8 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowJobDetails(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Add job update functionality
                      setShowJobDetails(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
                  >
                    Update Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

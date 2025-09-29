// src/pages/employee/dashboard.tsx

/**
 * 👷 EMPLOYEE DASHBOARD
 * 
 * Comprehensive employee dashboard for field workers and technicians.
 * Mobile-optimized interface for job management and daily operations.
 * 
 * FEATURES:
 * - Today's job schedule
 * - Time tracking and clock in/out
 * - Quick photo upload
 * - Location check-in
 * - Performance metrics
 * - Team communication
 * - Payroll summary
 * - Training progress
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import EmployeeLayout from '@/components/EmployeeLayout';
import { 
  ClipboardDocumentListIcon,
  CameraIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface JobAssignment {
  id: string;
  customer: string;
  address: string;
  type: 'maintenance' | 'repair' | 'installation' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold';
  scheduledTime: string;
  estimatedDuration: number;
  description: string;
  skills: string[];
}

interface PerformanceMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface TeamMessage {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  type: 'info' | 'urgent' | 'update';
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysJobs, setTodaysJobs] = useState<JobAssignment[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [isOnClock, setIsOnClock] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(6.5);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate today's job assignments
    setTodaysJobs([
      {
        id: '1',
        customer: 'Johnson Residence',
        address: '123 Oak Street',
        type: 'maintenance',
        priority: 'medium',
        status: 'pending',
        scheduledTime: '9:00 AM',
        estimatedDuration: 120,
        description: 'Annual HVAC maintenance and filter replacement',
        skills: ['HVAC', 'Maintenance']
      },
      {
        id: '2',
        customer: 'Downtown Office',
        address: '456 Business Ave',
        type: 'repair',
        priority: 'high',
        status: 'pending',
        scheduledTime: '1:00 PM',
        estimatedDuration: 180,
        description: 'AC unit not cooling properly - diagnostic needed',
        skills: ['HVAC', 'Diagnostics', 'Repair']
      },
      {
        id: '3',
        customer: 'Smith Family',
        address: '789 Maple Drive',
        type: 'installation',
        priority: 'medium',
        status: 'pending',
        scheduledTime: '4:00 PM',
        estimatedDuration: 240,
        description: 'Install new smart thermostat system',
        skills: ['Installation', 'Smart Systems']
      }
    ]);

    setMetrics([
      {
        title: 'Jobs Completed',
        value: '47',
        change: '+5',
        changeType: 'positive',
        icon: CheckCircleIcon,
        color: 'green'
      },
      {
        title: 'Customer Rating',
        value: '4.8',
        change: '+0.2',
        changeType: 'positive',
        icon: StarIcon,
        color: 'yellow'
      },
      {
        title: 'Hours This Week',
        value: '38.5',
        change: '+2.5',
        changeType: 'positive',
        icon: ClockIcon,
        color: 'blue'
      },
      {
        title: 'Efficiency Score',
        value: '92%',
        change: '+3%',
        changeType: 'positive',
        icon: TrophyIcon,
        color: 'purple'
      }
    ]);

    setMessages([
      {
        id: '1',
        from: 'Sarah (Dispatcher)',
        message: 'Johnson job moved to 9:30 AM due to traffic',
        timestamp: '8:15 AM',
        type: 'update'
      },
      {
        id: '2',
        from: 'Mike (Team Lead)',
        message: 'Great work on the downtown office job yesterday!',
        timestamp: '7:45 AM',
        type: 'info'
      },
      {
        id: '3',
        from: 'System Alert',
        message: 'New safety training module available',
        timestamp: '7:30 AM',
        type: 'info'
      }
    ]);
  }, []);

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'in-progress': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'on-hold': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
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

  const getMetricColor = (color: string) => {
    const colorMap: Record<string, string> = {
      green: 'text-green-400 bg-green-500/20',
      yellow: 'text-yellow-400 bg-yellow-500/20',
      blue: 'text-blue-400 bg-blue-500/20',
      purple: 'text-purple-400 bg-purple-500/20'
    };
    return colorMap[color] || 'text-slate-400 bg-slate-500/20';
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-red-500/30 bg-red-500/10';
      case 'update': return 'border-blue-500/30 bg-blue-500/10';
      default: return 'border-green-500/30 bg-green-500/10';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <EmployeeLayout 
      title="Dashboard" 
      subtitle="Welcome back, John! You have 3 jobs scheduled today."
    >
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getMetricColor(metric.color)}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  metric.changeType === 'positive' ? 'text-green-400' :
                  metric.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {metric.changeType === 'positive' ? (
                    <ArrowUpIcon className="h-4 w-4" />
                  ) : metric.changeType === 'negative' ? (
                    <ArrowDownIcon className="h-4 w-4" />
                  ) : null}
                  <span>{metric.change}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                <p className="text-sm text-slate-400">{metric.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Time Clock & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Time Clock */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Time Clock</h2>
            <div className="text-center">
              <div className="text-3xl font-mono text-green-400 mb-2">
                {formatTime(currentTime)}
              </div>
              <div className="text-slate-400 mb-6">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="mb-6">
                <div className="text-sm text-slate-400 mb-2">Hours Today</div>
                <div className="text-2xl font-bold text-white">{hoursWorked}h</div>
              </div>
              <button
                onClick={() => setIsOnClock(!isOnClock)}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isOnClock
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                }`}
              >
                {isOnClock ? 'Clock Out' : 'Clock In'}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-6">
            <button 
              onClick={() => router.push('/employee/photos')}
              className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6 text-left hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group"
            >
              <CameraIcon className="h-8 w-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Take Photo</h3>
              <p className="text-slate-400 text-sm">Document job progress</p>
            </button>

            <button 
              onClick={() => router.push('/employee/location')}
              className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6 text-left hover:from-green-500/30 hover:to-green-600/30 transition-all duration-300 group"
            >
              <MapPinIcon className="h-8 w-8 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Check In</h3>
              <p className="text-slate-400 text-sm">Location verification</p>
            </button>

            <button 
              onClick={() => router.push('/employee/jobs')}
              className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6 text-left hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-300 group"
            >
              <ClipboardDocumentListIcon className="h-8 w-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">View Jobs</h3>
              <p className="text-slate-400 text-sm">Today's assignments</p>
            </button>

            <button 
              onClick={() => router.push('/employee/payroll')}
              className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-2xl p-6 text-left hover:from-yellow-500/30 hover:to-yellow-600/30 transition-all duration-300 group"
            >
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Payroll</h3>
              <p className="text-slate-400 text-sm">Hours and earnings</p>
            </button>
          </div>
        </div>

        {/* Today's Jobs and Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Jobs */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Today's Jobs</h2>
              <span className="text-green-400 text-sm font-medium">{todaysJobs.length} scheduled</span>
            </div>
            <div className="space-y-4">
              {todaysJobs.map((job) => (
                <div key={job.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 hover:border-green-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-white">{job.customer}</h3>
                      <p className="text-sm text-slate-400">{job.address}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getJobStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{job.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-blue-400">
                        <ClockIcon className="h-4 w-4" />
                        <span>{job.scheduledTime}</span>
                      </div>
                      <div className="text-slate-400">
                        {job.estimatedDuration}min
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {job.skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Messages */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Team Messages</h2>
              <button className="text-green-400 hover:text-green-300 text-sm">View All</button>
            </div>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`rounded-lg p-4 border ${getMessageTypeColor(message.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white text-sm">{message.from}</h3>
                    <span className="text-slate-400 text-xs">{message.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{message.message}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => router.push('/employee/messages')}
              className="w-full mt-4 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
            >
              Send Message
            </button>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">This Week Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">15</div>
              <div className="text-slate-400">Jobs Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">38.5</div>
              <div className="text-slate-400">Hours Worked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">4.9</div>
              <div className="text-slate-400">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}

// src/components/EmployeeLayout.tsx

/**
 * 👷 EMPLOYEE PORTAL LAYOUT
 * 
 * Comprehensive employee portal layout for field workers and technicians.
 * Mobile-first design optimized for on-the-go job management.
 * 
 * FEATURES:
 * - Mobile-optimized navigation
 * - Job logging and tracking
 * - Photo upload capabilities
 * - Geolocation tracking
 * - HR integration access
 * - Payroll and timesheet access
 * - Skill-based job matching
 * - Real-time communication
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ClipboardDocumentListIcon,
  CameraIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CalendarIcon,
  DocumentTextIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface EmployeeLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

// Employee Navigation Structure
const navigationSections = [
  {
    title: 'Daily Operations',
    items: [
      { name: 'Dashboard', href: '/employee/dashboard', icon: HomeIcon },
      { name: 'My Jobs', href: '/employee/jobs', icon: ClipboardDocumentListIcon },
      { name: 'Schedule', href: '/employee/schedule', icon: CalendarIcon },
      { name: 'Time Clock', href: '/employee/timeclock', icon: ClockIcon },
    ]
  },
  {
    title: 'Field Tools',
    items: [
      { name: 'Job Photos', href: '/employee/photos', icon: CameraIcon },
      { name: 'Location Check-in', href: '/employee/location', icon: MapPinIcon },
      { name: 'Job Reports', href: '/employee/reports', icon: DocumentTextIcon },
      { name: 'Inventory', href: '/employee/inventory', icon: WrenchScrewdriverIcon },
    ]
  },
  {
    title: 'HR & Payroll',
    items: [
      { name: 'Payroll', href: '/employee/payroll', icon: CurrencyDollarIcon },
      { name: 'Team Directory', href: '/employee/team', icon: UserGroupIcon },
      { name: 'Training', href: '/employee/training', icon: AcademicCapIcon },
      { name: 'Messages', href: '/employee/messages', icon: ChatBubbleLeftRightIcon },
    ]
  }
];

export default function EmployeeLayout({ children, title, subtitle }: EmployeeLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnClock, setIsOnClock] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get current location for check-in features
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
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClockInOut = () => {
    setIsOnClock(!isOnClock);
    // TODO: Implement actual time tracking API call
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex h-full flex-col bg-slate-900/95 backdrop-blur-xl border-r border-green-500/20">
          {/* Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-green-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  Employee Portal
                </h1>
                <p className="text-xs text-green-300">Field Operations</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Time Clock Status */}
          <div className="px-6 py-4 border-b border-green-500/20">
            <div className={`rounded-lg p-3 border ${
              isOnClock 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-slate-500/10 border-slate-500/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-300">Time Clock</span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isOnClock ? 'bg-green-400 animate-pulse' : 'bg-slate-400'
                  }`}></div>
                  <span className={`text-xs ${
                    isOnClock ? 'text-green-400' : 'text-slate-400'
                  }`}>
                    {isOnClock ? 'On Clock' : 'Off Clock'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-400 mb-3">
                <div>{formatDate(currentTime)}</div>
                <div className="font-mono text-green-300">{formatTime(currentTime)}</div>
              </div>
              <button
                onClick={handleClockInOut}
                className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isOnClock
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {isOnClock ? 'Clock Out' : 'Clock In'}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-8">
              {navigationSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = router.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border border-green-500/30 shadow-lg shadow-green-500/20'
                              : 'text-slate-300 hover:text-white hover:bg-green-500/10 hover:border-green-500/20 border border-transparent'
                          }`}
                        >
                          <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                            isActive ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'
                          }`} />
                          {item.name}
                          {isActive && (
                            <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-green-500/20">
            <div className="text-xs text-slate-400 text-center">
              <div>StreamFlow Employee Portal</div>
              <div className="text-green-300">v1.0.0 Mobile</div>
              {currentLocation && (
                <div className="text-xs text-slate-500 mt-1">
                  📍 Location Services Active
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-green-500/20">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              
              <div>
                {title && (
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-slate-400">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <CameraIcon className="h-5 w-5" />
              </button>

              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <MapPinIcon className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <BellIcon className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">John Technician</div>
                  <div className="text-xs text-green-300">Field Worker</div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">JT</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// src/components/RobinsonPremiumLayout.tsx

/**
 * 🏢 ROBINSON SOLUTIONS PREMIUM LAYOUT
 * 
 * Ultra-premium desktop program design with medium metallic blue color scheme.
 * Professional navigation systems for enterprise-grade applications.
 * 
 * FEATURES:
 * - Robinson Solutions branding and identity
 * - Medium metallic blue color scheme
 * - High-tech professional navigation
 * - Desktop program aesthetics
 * - Enterprise-grade visual hierarchy
 * - Premium glass-morphism effects
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  CogIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  CloudIcon,
  BoltIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface RobinsonPremiumLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

// Robinson Solutions Navigation Structure
const navigationSections = [
  {
    title: 'Dashboard & Analytics',
    items: [
      { name: 'Executive Dashboard', href: '/robinson/dashboard', icon: HomeIcon },
      { name: 'Business Intelligence', href: '/robinson/analytics', icon: PresentationChartLineIcon },
      { name: 'Performance Metrics', href: '/robinson/metrics', icon: ChartBarIcon },
      { name: 'Financial Overview', href: '/robinson/financial', icon: CurrencyDollarIcon },
    ]
  },
  {
    title: 'Client Management',
    items: [
      { name: 'Client Portfolio', href: '/robinson/clients', icon: BuildingOfficeIcon },
      { name: 'Account Management', href: '/robinson/accounts', icon: UserGroupIcon },
      { name: 'Project Oversight', href: '/robinson/projects', icon: DocumentTextIcon },
      { name: 'Service Delivery', href: '/robinson/services', icon: BoltIcon },
    ]
  },
  {
    title: 'Operations & Security',
    items: [
      { name: 'Security Center', href: '/robinson/security', icon: ShieldCheckIcon },
      { name: 'System Administration', href: '/robinson/admin', icon: CogIcon },
      { name: 'Cloud Infrastructure', href: '/robinson/cloud', icon: CloudIcon },
      { name: 'Global Operations', href: '/robinson/global', icon: GlobeAltIcon },
    ]
  }
];

export default function RobinsonPremiumLayout({ children, title, subtitle }: RobinsonPremiumLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(74, 144, 226, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(74, 144, 226, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex h-full flex-col bg-slate-900/95 backdrop-blur-xl border-r border-blue-500/20">
          {/* Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Robinson Solutions
                </h1>
                <p className="text-xs text-blue-300">Enterprise Platform</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* System Status */}
          <div className="px-6 py-4 border-b border-blue-500/20">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-300">System Status</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                <div>{formatDate(currentTime)}</div>
                <div className="font-mono text-blue-300">{formatTime(currentTime)} UTC</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-8">
              {navigationSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">
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
                              ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/20'
                              : 'text-slate-300 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent'
                          }`}
                        >
                          <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                            isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'
                          }`} />
                          {item.name}
                          {isActive && (
                            <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
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
          <div className="px-6 py-4 border-t border-blue-500/20">
            <div className="text-xs text-slate-400 text-center">
              <div>Robinson Solutions Platform</div>
              <div className="text-blue-300">v2.0.1 Enterprise</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-blue-500/20">
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
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-slate-400">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-blue-500/20 text-white rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-64"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <BellIcon className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">Administrator</div>
                  <div className="text-xs text-blue-300">Robinson Solutions</div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">A</span>
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

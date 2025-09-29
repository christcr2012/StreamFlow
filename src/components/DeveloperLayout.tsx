// src/components/DeveloperLayout.tsx

/**
 * 🛠️ DEVELOPER SYSTEM LAYOUT
 * 
 * Completely isolated layout for the developer system.
 * NO client-side business features - only system administration tools.
 * 
 * FEATURES:
 * - System monitoring and debugging
 * - User impersonation for support
 * - Database administration
 * - API testing and development tools
 * - High-tech green theme (masculine, cutting-edge)
 */

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChartBarIcon,
  CogIcon,
  CircleStackIcon,
  BugAntIcon,
  UserIcon,
  CommandLineIcon,
  ServerIcon,
  EyeIcon,
  CodeBracketIcon,
  CloudIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BoltIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  RocketLaunchIcon,
  FireIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface DeveloperLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const navigationSections = [
  {
    title: 'System Monitoring',
    items: [
      { name: 'System Dashboard', href: '/dev', icon: ChartBarIcon },
      { name: 'Performance Monitor', href: '/dev/monitor', icon: CpuChipIcon },
      { name: 'System Health', href: '/dev/health', icon: ServerIcon },
      { name: 'Error Tracking', href: '/dev/errors', icon: ExclamationTriangleIcon },
      { name: 'Real-time Logs', href: '/dev/logs', icon: EyeIcon },
      { name: 'Metrics & Analytics', href: '/dev/metrics', icon: ChartBarIcon },
    ]
  },
  {
    title: 'Database Administration',
    items: [
      { name: 'Database Console', href: '/dev/database', icon: CircleStackIcon },
      { name: 'Query Builder', href: '/dev/query', icon: CodeBracketIcon },
      { name: 'Schema Management', href: '/dev/schema', icon: WrenchScrewdriverIcon },
      { name: 'Data Migration', href: '/dev/migration', icon: ArrowPathIcon },
      { name: 'Backup & Recovery', href: '/dev/backup', icon: ShieldCheckIcon },
      { name: 'Performance Tuning', href: '/dev/db-performance', icon: BoltIcon },
    ]
  },
  {
    title: 'Development Tools',
    items: [
      { name: 'API Testing Suite', href: '/dev/api-test', icon: CommandLineIcon },
      { name: 'Code Playground', href: '/dev/playground', icon: CodeBracketIcon },
      { name: 'Debug Console', href: '/dev/debug', icon: BugAntIcon },
      { name: 'Feature Flags', href: '/dev/features', icon: BoltIcon },
      { name: 'A/B Testing', href: '/dev/testing', icon: BeakerIcon },
      { name: 'Performance Profiler', href: '/dev/profiler', icon: FireIcon },
    ]
  },
  {
    title: 'User Management',
    items: [
      { name: 'User Impersonation', href: '/dev/impersonate', icon: UserIcon },
      { name: 'User Analytics', href: '/dev/user-analytics', icon: MagnifyingGlassIcon },
      { name: 'Session Management', href: '/dev/sessions', icon: ShieldCheckIcon },
      { name: 'Access Control', href: '/dev/access', icon: ShieldCheckIcon },
    ]
  },
  {
    title: 'Infrastructure',
    items: [
      { name: 'Cloud Resources', href: '/dev/cloud', icon: CloudIcon },
      { name: 'Deployment Pipeline', href: '/dev/deployment', icon: RocketLaunchIcon },
      { name: 'Environment Config', href: '/dev/environment', icon: CogIcon },
      { name: 'Service Status', href: '/dev/services', icon: ServerIcon },
      { name: 'Load Balancing', href: '/dev/load-balancer', icon: BoltIcon },
    ]
  },
  {
    title: 'Security & Compliance',
    items: [
      { name: 'Security Dashboard', href: '/dev/security', icon: ShieldCheckIcon },
      { name: 'Vulnerability Scanner', href: '/dev/vulnerabilities', icon: MagnifyingGlassIcon },
      { name: 'Audit Logs', href: '/dev/audit', icon: DocumentTextIcon },
      { name: 'Compliance Reports', href: '/dev/compliance', icon: DocumentTextIcon },
    ]
  },
  {
    title: 'Innovation Lab',
    items: [
      { name: 'AI Experiments', href: '/dev/ai-lab', icon: LightBulbIcon },
      { name: 'Beta Features', href: '/dev/beta', icon: BeakerIcon },
      { name: 'Research & Development', href: '/dev/research', icon: LightBulbIcon },
      { name: 'Prototype Testing', href: '/dev/prototypes', icon: WrenchScrewdriverIcon },
    ]
  },
  {
    title: 'System Administration',
    items: [
      { name: 'System Settings', href: '/dev/settings', icon: CogIcon },
      { name: 'Configuration Manager', href: '/dev/config', icon: WrenchScrewdriverIcon },
      { name: 'System Maintenance', href: '/dev/maintenance', icon: WrenchScrewdriverIcon },
    ]
  }
];

function DeveloperLayout({ children, title = 'Developer System', subtitle }: DeveloperLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Futuristic Grid Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Developer Header */}
      <header className="relative bg-slate-900/95 backdrop-blur-xl border-b border-green-500/20 shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                {/* Futuristic Logo */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                    <CommandLineIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                    DevSystem
                  </h1>
                  <p className="text-sm text-green-400 font-medium tracking-wide">
                    SYSTEM ADMINISTRATION & DEVELOPMENT
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* System Status Indicators */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs text-slate-300 font-mono">
                    SYSTEM ONLINE
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-600"></div>
                <div className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Developer Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">DEVELOPER</p>
                  <p className="text-xs text-green-400 font-mono">SYS.ADMIN</p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center border border-green-500/30">
                    <UserIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Futuristic Developer Sidebar */}
        <nav className="w-72 bg-slate-900/95 backdrop-blur-xl border-r border-green-500/20 min-h-screen relative">
          {/* Sidebar Glow Effect */}
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-green-500/50 to-transparent"></div>

          <div className="p-6 overflow-y-auto">
            {navigationSections.map((section) => (
              <div key={section.title} className="mb-8">
                <h3 className="px-4 text-xs font-bold text-green-400 uppercase tracking-widest mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden
                          ${isActive
                            ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-100 border border-green-500/30 shadow-lg shadow-green-500/10'
                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-green-100 hover:border-green-500/20 border border-transparent'
                          }
                        `}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600"></div>
                        )}

                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-slate-800/50 text-slate-400 group-hover:bg-green-500/10 group-hover:text-green-400'
                        }`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1">{item.name}</span>

                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Futuristic System Status Panel */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-green-500/20 shadow-2xl shadow-green-500/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wider">System Status</p>
                  <p className="text-lg font-bold text-white font-mono">ONLINE</p>
                </div>
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl flex items-center justify-center border border-green-500/30">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs text-slate-300 font-mono">
                    ALL SERVICES OPERATIONAL
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Futuristic Main Content */}
        <main className="flex-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 relative">
          {/* Content Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
            }}></div>
          </div>

          <div className="relative p-8">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  {title}
                </h2>
              </div>
              <p className="text-slate-300 ml-6 text-lg">
                {subtitle || 'Developer system administration and debugging tools'}
              </p>
            </div>

            {/* Main Content Container */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 shadow-2xl shadow-green-500/5 min-h-[700px] relative overflow-hidden">
              {/* Content Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5 pointer-events-none"></div>

              <div className="relative p-8">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DeveloperLayout;

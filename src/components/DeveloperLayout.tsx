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

export default function DeveloperLayout({ children, title = 'Developer System' }: DeveloperLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Developer Header */}
      <header className="bg-gray-800 border-b border-green-500/20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CommandLineIcon className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-green-400">StreamFlow DevSystem</h1>
                  <p className="text-xs text-gray-400">System Administration & Development</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-green-400">Developer</p>
                <p className="text-xs text-gray-400">System Administrator</p>
              </div>
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Developer Sidebar */}
        <nav className="w-64 bg-gray-800 border-r border-green-500/20 min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-green-400'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System Status */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-700 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">System Online</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">All services operational</p>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 bg-gray-900">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="text-gray-400 mt-1">Developer system administration and debugging tools</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg border border-green-500/20 min-h-[600px] overflow-hidden">
              <div className="h-full">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

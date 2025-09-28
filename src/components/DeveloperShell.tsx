// src/components/DeveloperShell.tsx

/**
 * 🛠️ DEVELOPER-SIDE SHELL COMPONENT
 * 
 * Completely separate from client-side infrastructure.
 * This is the developer system shell - NOT a client portal.
 * 
 * DEVELOPER SYSTEM ARCHITECTURE:
 * - Independent authentication and session management
 * - Developer-specific tools and monitoring
 * - System administration capabilities
 * - AI development and debugging tools
 * - Separate from client business operations
 * 
 * SECURITY:
 * - Developer-only access control (OWNER + specific emails)
 * - Comprehensive audit logging
 * - Secure development environment
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface DeveloperShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function DeveloperShell({ children, title = "StreamFlow Developer" }: DeveloperShellProps) {
  const router = useRouter();
  const { pathname } = router;

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="StreamFlow Developer System" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        {/* Developer Header */}
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Developer Brand */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🛠️</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">StreamFlow</h1>
                    <p className="text-xs text-green-300">Developer System</p>
                  </div>
                </div>
              </div>

              {/* Developer Actions */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>Dev Environment</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Developer Sidebar */}
          <aside className="w-64 min-h-screen bg-gray-800/30 backdrop-blur-sm border-r border-gray-700/50">
            <nav className="p-4 space-y-2">
              {/* Developer Navigation */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Development Tools
                </h2>
                <div className="space-y-1">
                  <DeveloperNavLink 
                    href="/dev" 
                    active={isActive('/dev') && pathname === '/dev'}
                    icon="📊"
                  >
                    Command Center
                  </DeveloperNavLink>
                  <DeveloperNavLink 
                    href="/dev/system" 
                    active={isActive('/dev/system')}
                    icon="⚡"
                  >
                    System Monitor
                  </DeveloperNavLink>
                  <DeveloperNavLink 
                    href="/dev/ai" 
                    active={isActive('/dev/ai')}
                    icon="🤖"
                  >
                    AI Development
                  </DeveloperNavLink>
                  <DeveloperNavLink 
                    href="/dev/database" 
                    active={isActive('/dev/database')}
                    icon="🗄️"
                  >
                    Database Tools
                  </DeveloperNavLink>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Testing & QA
                </h2>
                <div className="space-y-1">
                  <DeveloperNavLink 
                    href="/dev/testing" 
                    active={isActive('/dev/testing')}
                    icon="🧪"
                  >
                    Portal Testing
                  </DeveloperNavLink>
                  <DeveloperNavLink 
                    href="/dev/api" 
                    active={isActive('/dev/api')}
                    icon="🔌"
                  >
                    API Testing
                  </DeveloperNavLink>
                  <DeveloperNavLink 
                    href="/dev/logs" 
                    active={isActive('/dev/logs')}
                    icon="📋"
                  >
                    System Logs
                  </DeveloperNavLink>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Federation Development
                </h2>
                <div className="space-y-1">
                  <DeveloperNavLink 
                    href="/dev/federation" 
                    active={isActive('/dev/federation')}
                    icon="🌐"
                  >
                    Federation Tools
                  </DeveloperNavLink>
                  <DeveloperNavLink 
                    href="/dev/deployment" 
                    active={isActive('/dev/deployment')}
                    icon="🚀"
                  >
                    Deployment
                  </DeveloperNavLink>
                </div>
              </div>

              {/* Quick Portal Access */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Portal Access
                </h2>
                <div className="space-y-1">
                  <DeveloperNavLink 
                    href="/provider/dashboard" 
                    active={false}
                    icon="🏢"
                    external
                  >
                    Provider Portal
                  </DeveloperNavLink>
                  <DeveloperNavLink 
                    href="/dashboard" 
                    active={false}
                    icon="👑"
                    external
                  >
                    Admin Portal
                  </DeveloperNavLink>
                  <DeveloperNavLink 
                    href="/worker/home" 
                    active={false}
                    icon="👷"
                    external
                  >
                    Employee Portal
                  </DeveloperNavLink>
                </div>
              </div>

              {/* Developer System Status */}
              <div className="mt-8 p-3 bg-gray-700/30 rounded-lg">
                <div className="text-xs text-gray-400 mb-2">System Health</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">Database</span>
                    <span className="flex items-center text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">API</span>
                    <span className="flex items-center text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">AI Services</span>
                    <span className="flex items-center text-yellow-400">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </nav>
          </aside>

          {/* Developer Main Content */}
          <main className="flex-1 min-h-screen">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

interface DeveloperNavLinkProps {
  href: string;
  active: boolean;
  icon: string;
  children: React.ReactNode;
  external?: boolean;
}

function DeveloperNavLink({ href, active, icon, children, external = false }: DeveloperNavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
        active
          ? 'bg-green-600/20 text-green-300 border border-green-500/30'
          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
      }`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className="mr-3 text-base">{icon}</span>
      {children}
      {external && <span className="ml-auto text-xs text-gray-500">↗</span>}
    </Link>
  );
}

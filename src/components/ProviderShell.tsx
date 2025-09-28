// src/components/ProviderShell.tsx

/**
 * 🏢 PROVIDER-SIDE SHELL COMPONENT
 * 
 * Completely separate from client-side infrastructure.
 * This is the provider federation system shell - NOT a client portal.
 * 
 * PROVIDER SYSTEM ARCHITECTURE:
 * - Independent authentication and session management
 * - Provider-specific navigation and branding
 * - Federation-ready infrastructure
 * - Revenue and client management focus
 * - Separate from client business operations
 * 
 * SECURITY:
 * - Provider-only access control
 * - Audit logging for all provider actions
 * - Secure provider session management
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface ProviderShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function ProviderShell({ children, title = "StreamFlow Provider" }: ProviderShellProps) {
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
        <meta name="description" content="StreamFlow Provider Federation System" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Provider Header */}
        <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Provider Brand */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SF</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">StreamFlow</h1>
                    <p className="text-xs text-blue-300">Provider Federation</p>
                  </div>
                </div>
              </div>

              {/* Provider Actions */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Provider System</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Provider Sidebar */}
          <aside className="w-64 min-h-screen bg-slate-800/30 backdrop-blur-sm border-r border-slate-700/50">
            <nav className="p-4 space-y-2">
              {/* Provider Navigation */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Provider Operations
                </h2>
                <div className="space-y-1">
                  <ProviderNavLink 
                    href="/provider/dashboard" 
                    active={isActive('/provider/dashboard')}
                    icon="📊"
                  >
                    Command Center
                  </ProviderNavLink>
                  <ProviderNavLink 
                    href="/provider/clients" 
                    active={isActive('/provider/clients')}
                    icon="🏢"
                  >
                    Client Management
                  </ProviderNavLink>
                  <ProviderNavLink 
                    href="/provider/revenue" 
                    active={isActive('/provider/revenue')}
                    icon="💰"
                  >
                    Revenue Analytics
                  </ProviderNavLink>
                  <ProviderNavLink 
                    href="/provider/billing" 
                    active={isActive('/provider/billing')}
                    icon="📋"
                  >
                    Billing Management
                  </ProviderNavLink>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  System Management
                </h2>
                <div className="space-y-1">
                  <ProviderNavLink 
                    href="/provider/analytics" 
                    active={isActive('/provider/analytics')}
                    icon="📈"
                  >
                    Platform Analytics
                  </ProviderNavLink>
                  <ProviderNavLink 
                    href="/provider/settings" 
                    active={isActive('/provider/settings')}
                    icon="⚙️"
                  >
                    Provider Settings
                  </ProviderNavLink>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Federation (Coming Soon)
                </h2>
                <div className="space-y-1">
                  <ProviderNavLink 
                    href="/provider/federation" 
                    active={isActive('/provider/federation')}
                    icon="🌐"
                    disabled
                  >
                    Federation Network
                  </ProviderNavLink>
                  <ProviderNavLink 
                    href="/provider/instances" 
                    active={isActive('/provider/instances')}
                    icon="🔗"
                    disabled
                  >
                    Instance Management
                  </ProviderNavLink>
                </div>
              </div>

              {/* Provider System Status */}
              <div className="mt-8 p-3 bg-slate-700/30 rounded-lg">
                <div className="text-xs text-slate-400 mb-2">System Status</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Platform</span>
                    <span className="flex items-center text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Federation</span>
                    <span className="flex items-center text-yellow-400">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1"></span>
                      Pending
                    </span>
                  </div>
                </div>
              </div>
            </nav>
          </aside>

          {/* Provider Main Content */}
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

interface ProviderNavLinkProps {
  href: string;
  active: boolean;
  icon: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ProviderNavLink({ href, active, icon, children, disabled = false }: ProviderNavLinkProps) {
  if (disabled) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
        <span className="mr-3 text-base opacity-50">{icon}</span>
        <span className="opacity-50">{children}</span>
        <span className="ml-auto text-xs bg-slate-600 px-2 py-0.5 rounded text-slate-400">Soon</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
        active
          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      <span className="mr-3 text-base">{icon}</span>
      {children}
    </Link>
  );
}

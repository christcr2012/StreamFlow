// src/pages/dev/index.tsx

/**
 * 🛠️ DEVELOPER COMMAND CENTER
 * 
 * World-class developer dashboard that exceeds industry standards.
 * Inspired by GitHub Codespaces, Vercel Dashboard, and AWS Developer Console.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DeveloperLayout from '@/components/DeveloperLayout';
import { useMe } from '@/lib/useMe';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface DeveloperMetrics {
  systemUptime: number;
  apiResponseTime: number;
  aiModelsActive: number;
  aiTokensUsed: number;
  codeQualityScore: number;
  testCoverage: number;
  federationHealth: number;
  federationLatency: number;
}

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  ai: 'healthy' | 'warning' | 'error';
  federation: 'healthy' | 'warning' | 'error';
  cache: 'healthy' | 'warning' | 'error';
}

export default function DeveloperDashboard() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has developer access (OWNER role or specific dev permissions)
  const isDeveloper = me?.role === 'OWNER' || me?.email === 'gametcr3@gmail.com';

  // Redirect non-developers
  useEffect(() => {
    if (!loading && !isDeveloper) {
      router.push('/dashboard');
    }
  }, [me, loading, isDeveloper, router]);

  // Fetch developer metrics
  const { data: metrics } = useSWR<DeveloperMetrics>(
    isDeveloper ? '/api/dev/metrics' : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  // Fetch system status
  const { data: systemStatus } = useSWR<SystemStatus>(
    isDeveloper ? '/api/dev/system-status' : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  if (loading) {
    return (
      <DeveloperLayout title="Loading Developer Dashboard...">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DeveloperLayout>
    );
  }

  if (!isDeveloper) {
    return null; // Will redirect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const formatPercentage = (value: number) => `${value?.toFixed(1) || '0.0'}%`;
  const formatNumber = (value: number) => value?.toLocaleString() || '0';

  return (
    <DeveloperLayout title="Developer Command Center - StreamFlow">
      
      <div className="space-y-8">
        {/* Futuristic Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/25">
                <span className="text-2xl text-white font-bold">DS</span>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse border-2 border-slate-900"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent mb-2">
                DEVELOPER COMMAND CENTER
              </h1>
              <p className="text-green-400 font-mono text-sm tracking-wider uppercase">
                AI DEVELOPMENT & SYSTEM ADMINISTRATION INTERFACE
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status Indicators */}
            {systemStatus && (
              <div className="flex items-center space-x-2">
                {Object.entries(systemStatus).map(([system, status]) => (
                  <div key={system} className={`flex items-center px-3 py-2 rounded-xl text-xs font-mono border backdrop-blur-sm ${getStatusColor(status)}`}>
                    <span className="mr-2">{getStatusIcon(status)}</span>
                    {system.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
            <div className="text-slate-400 text-sm font-mono">
              LAST SYNC: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'ai-tools', label: 'AI Development', icon: '🤖' },
              { id: 'system', label: 'System Monitor', icon: '⚡' },
              { id: 'federation', label: 'Federation', icon: '🌐' },
              { id: 'database', label: 'Database', icon: '🗄️' },
              { id: 'api', label: 'API Tools', icon: '🔌' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Metrics Grid */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(metrics.systemUptime)}
                      </div>
                      <div className="text-sm text-gray-600">System Uptime</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {metrics.apiResponseTime}ms avg response
                      </div>
                    </div>
                    <div className="text-green-500 text-2xl">⚡</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{metrics.aiModelsActive}</div>
                      <div className="text-sm text-gray-600">AI Models Active</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatNumber(metrics.aiTokensUsed)} tokens used
                      </div>
                    </div>
                    <div className="text-blue-500 text-2xl">🤖</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatPercentage(metrics.codeQualityScore)}
                      </div>
                      <div className="text-sm text-gray-600">Code Quality</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPercentage(metrics.testCoverage)} test coverage
                      </div>
                    </div>
                    <div className="text-purple-500 text-2xl">📝</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatPercentage(metrics.federationHealth)}
                      </div>
                      <div className="text-sm text-gray-600">Federation Health</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {metrics.federationLatency}ms latency
                      </div>
                    </div>
                    <div className="text-indigo-500 text-2xl">🌐</div>
                  </div>
                </div>
              </div>
            )}

            {/* Portal Testing Links */}
            <div className="bg-white rounded-lg border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Portal Testing</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "Admin Portal (Owner)", href: "/dashboard", description: "Full admin access with all features", icon: "👑" },
                    { name: "Admin Portal (Manager)", href: "/dashboard", description: "Manager-level admin access", icon: "👨‍💼" },
                    { name: "Employee Portal", href: "/worker/home", description: "Mobile-optimized employee portal", icon: "👷" },
                    { name: "Provider Portal", href: "/provider", description: "Provider federation and analytics", icon: "🏢" },
                    { name: "Accountant Portal", href: "/accountant/reports", description: "Financial reports and exports", icon: "📊" },
                    { name: "Client Portal", href: "/clients", description: "Client management interface", icon: "🤝" },
                    { name: "System Validation", href: "/dev/system-validation", description: "Complete system health monitoring", icon: "🧪" },
                    { name: "Final Integration", href: "/dev/final-integration", description: "Cross-portal integration testing", icon: "🚀" },
                    { name: "Integration Test", href: "/dev/integration-test", description: "System integration analysis", icon: "⚡" },
                  ].map((portal) => (
                    <button
                      key={portal.name}
                      onClick={() => router.push(portal.href)}
                      className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{portal.icon}</span>
                        <h3 className="font-medium text-gray-900">{portal.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{portal.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Tools
            </h3>
            <p className="text-gray-600">Advanced developer tools coming soon...</p>
          </div>
        )}
      </div>
    </DeveloperLayout>
  );
}

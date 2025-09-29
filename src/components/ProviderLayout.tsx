// src/components/ProviderLayout.tsx

/**
 * 🏢 PROVIDER SYSTEM LAYOUT
 * 
 * Completely isolated layout for the provider system (StreamCore).
 * NO client-side business features - only cross-client management tools.
 * 
 * FEATURES:
 * - Multi-client dashboard and analytics
 * - Revenue tracking and monetization console
 * - Client health monitoring and alerts
 * - White-label management and branding
 * - Federation control and settings
 */

import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RecoveryModeBanner from './RecoveryModeBanner';
import {
  ChartBarIcon,
  CogIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BellIcon,
  PaintBrushIcon,
  ServerStackIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CreditCardIcon,
  ChartPieIcon,
  BoltIcon,
  CloudIcon,
  KeyIcon,
  BeakerIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';

interface ProviderLayoutProps {
  children: ReactNode;
  title?: string;
  isRecoveryMode?: boolean;
}

const navigationSections = [
  {
    title: 'Business Intelligence',
    items: [
      { name: 'Provider Dashboard', href: '/provider', icon: ChartBarIcon },
      { name: 'Revenue Analytics', href: '/provider/revenue', icon: ArrowTrendingUpIcon },
      { name: 'Performance Metrics', href: '/provider/metrics', icon: ChartPieIcon },
      { name: 'Market Intelligence', href: '/provider/market', icon: GlobeAltIcon },
      { name: 'Competitive Analysis', href: '/provider/competition', icon: BeakerIcon },
    ]
  },
  {
    title: 'Client Operations',
    items: [
      { name: 'Client Portfolio', href: '/provider/clients', icon: BuildingOfficeIcon },
      { name: 'Client Health Monitoring', href: '/provider/health', icon: UserGroupIcon },
      { name: 'Client Onboarding', href: '/provider/onboarding', icon: AcademicCapIcon },
      { name: 'Client Success Management', href: '/provider/success', icon: ArrowTrendingUpIcon },
      { name: 'Churn Prevention', href: '/provider/retention', icon: ShieldCheckIcon },
    ]
  },
  {
    title: 'Monetization & Billing',
    items: [
      { name: 'Monetization Console', href: '/provider/monetization', icon: CurrencyDollarIcon },
      { name: 'Pricing Strategy', href: '/provider/pricing', icon: CreditCardIcon },
      { name: 'Billing Management', href: '/provider/billing', icon: DocumentTextIcon },
      { name: 'Revenue Optimization', href: '/provider/optimization', icon: BoltIcon },
      { name: 'Payment Processing', href: '/provider/payments', icon: CreditCardIcon },
    ]
  },
  {
    title: 'Platform Management',
    items: [
      { name: 'White-Label Branding', href: '/provider/branding', icon: PaintBrushIcon },
      { name: 'Feature Management', href: '/provider/features', icon: BoltIcon },
      { name: 'API Management', href: '/provider/api', icon: CloudIcon },
      { name: 'Security Center', href: '/provider/security', icon: ShieldCheckIcon },
      { name: 'System Alerts', href: '/provider/alerts', icon: BellIcon },
    ]
  },
  {
    title: 'Federation & Scaling',
    items: [
      { name: 'StreamCore Federation', href: '/provider/federation', icon: ServerStackIcon },
      { name: 'Partner Network', href: '/provider/partners', icon: UserGroupIcon },
      { name: 'Integration Hub', href: '/provider/integrations', icon: CloudIcon },
      { name: 'Marketplace', href: '/provider/marketplace', icon: GlobeAltIcon },
    ]
  },
  {
    title: 'Marketing & Growth',
    items: [
      { name: 'Lead Generation', href: '/provider/leads', icon: MegaphoneIcon },
      { name: 'Campaign Management', href: '/provider/campaigns', icon: BoltIcon },
      { name: 'A/B Testing', href: '/provider/testing', icon: BeakerIcon },
      { name: 'Growth Analytics', href: '/provider/growth', icon: ArrowTrendingUpIcon },
    ]
  },
  {
    title: 'System Administration',
    items: [
      { name: 'Provider Settings', href: '/provider/settings', icon: CogIcon },
      { name: 'Theme Management', href: '/provider/themes', icon: SwatchIcon },
      { name: 'Access Management', href: '/provider/access', icon: KeyIcon },
      { name: 'Audit Logs', href: '/provider/audit', icon: DocumentTextIcon },
      { name: 'System Health', href: '/provider/system-health', icon: ServerStackIcon },
    ]
  }
];

export default function ProviderLayout({
  children,
  title = 'StreamCore Provider',
  isRecoveryMode = false
}: ProviderLayoutProps) {
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState({
    database: 'unavailable' as const,
    api: 'limited' as const,
    authentication: 'recovery' as const,
    lastHealthCheck: new Date()
  });

  // Check system status periodically
  useEffect(() => {
    if (isRecoveryMode) {
      const checkStatus = async () => {
        try {
          // This would normally call an API to check system health
          // For now, we'll simulate the status
          setSystemStatus(prev => ({
            ...prev,
            lastHealthCheck: new Date()
          }));
        } catch (error) {
          console.error('Failed to check system status:', error);
        }
      };

      checkStatus();
      const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isRecoveryMode]);

  const handleRefreshStatus = async () => {
    // This would normally trigger a system health check
    console.log('Refreshing system status...');
    setSystemStatus(prev => ({
      ...prev,
      lastHealthCheck: new Date()
    }));
  };

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

      {/* Provider Header */}
      <header className="relative bg-slate-900/95 backdrop-blur-xl border-b border-green-500/20 shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                {/* Futuristic Logo */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                    <ServerStackIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                    StreamCore
                  </h1>
                  <p className="text-sm text-green-400 font-medium tracking-wide">
                    ENTERPRISE COMMAND CENTER
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* System Status Indicators */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isRecoveryMode ? 'bg-red-400 animate-pulse' : 'bg-green-400'
                  }`}></div>
                  <span className="text-xs text-slate-300 font-mono">
                    {isRecoveryMode ? 'RECOVERY' : 'OPERATIONAL'}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-600"></div>
                <div className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Provider Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">PROVIDER</p>
                  <p className="text-xs text-green-400 font-mono">ADMIN.CORE</p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center border border-green-500/30">
                    <BuildingOfficeIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Futuristic Provider Sidebar */}
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
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Network Status</p>
                  <p className="text-2xl font-bold text-white font-mono">12</p>
                  <p className="text-xs text-slate-400">Active Nodes</p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl flex items-center justify-center border border-green-500/30">
                    <BuildingOfficeIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* System Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400 font-mono">99.9%</div>
                  <div className="text-xs text-slate-400">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400 font-mono">2.1ms</div>
                  <div className="text-xs text-slate-400">Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400 font-mono">847K</div>
                  <div className="text-xs text-slate-400">Requests</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isRecoveryMode ? 'bg-red-400 animate-pulse' : 'bg-green-400 animate-pulse'
                  }`}></div>
                  <span className="text-xs text-slate-300 font-mono">
                    {isRecoveryMode ? 'RECOVERY MODE ACTIVE' : 'ALL SYSTEMS OPERATIONAL'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {systemStatus.lastHealthCheck.toLocaleTimeString()}
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
            {/* Recovery Mode Banner */}
            <RecoveryModeBanner
              isRecoveryMode={isRecoveryMode}
              onRefresh={handleRefreshStatus}
            />

            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  {title}
                </h2>
              </div>
              <p className="text-slate-300 ml-6 text-lg">
                {isRecoveryMode
                  ? 'Emergency operations mode - limited functionality available'
                  : 'Cross-client management and revenue optimization'
                }
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

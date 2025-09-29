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
  ArrowRightOnRectangleIcon
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
    <div className="min-h-screen bg-slate-50">
      {/* Provider Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <ServerStackIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">StreamCore</h1>
                  <p className="text-sm text-slate-600">Provider Management Platform</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Provider</p>
                <p className="text-xs text-slate-600">Platform Administrator</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Provider Sidebar */}
        <nav className="w-64 bg-white border-r border-slate-200 min-h-screen">
          <div className="p-4 overflow-y-auto">
            {navigationSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'
                          }
                        `}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Client Count & Status */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Active Clients</p>
                  <p className="text-2xl font-bold text-blue-700">12</p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${
                  isRecoveryMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                }`}></div>
                <span className="text-xs text-slate-600">
                  {isRecoveryMode ? 'Recovery mode active' : 'All systems operational'}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 bg-slate-50">
          <div className="p-6">
            {/* Recovery Mode Banner */}
            <RecoveryModeBanner
              isRecoveryMode={isRecoveryMode}
              onRefresh={handleRefreshStatus}
            />

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <p className="text-slate-600 mt-1">
                {isRecoveryMode
                  ? 'Emergency operations mode - limited functionality available'
                  : 'Cross-client management and revenue optimization'
                }
              </p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[600px]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

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

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ChartBarIcon, 
  CogIcon, 
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BellIcon,
  PaintBrushIcon,
  ServerStackIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface ProviderLayoutProps {
  children: ReactNode;
  title?: string;
}

const navigation = [
  { name: 'Provider Dashboard', href: '/provider', icon: ChartBarIcon },
  { name: 'Client Management', href: '/provider/clients', icon: BuildingOfficeIcon },
  { name: 'Revenue Analytics', href: '/provider/revenue', icon: CurrencyDollarIcon },
  { name: 'Monetization Console', href: '/provider/monetization', icon: CurrencyDollarIcon },
  { name: 'Client Health', href: '/provider/health', icon: UserGroupIcon },
  { name: 'System Alerts', href: '/provider/alerts', icon: BellIcon },
  { name: 'White-Label', href: '/provider/branding', icon: PaintBrushIcon },
  { name: 'Federation', href: '/provider/federation', icon: ServerStackIcon },
  { name: 'Provider Settings', href: '/provider/settings', icon: CogIcon },
];

export default function ProviderLayout({ children, title = 'StreamCore Provider' }: ProviderLayoutProps) {
  const router = useRouter();

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
          <div className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
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
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
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
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">All systems operational</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 bg-slate-50">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <p className="text-slate-600 mt-1">Cross-client management and revenue optimization</p>
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

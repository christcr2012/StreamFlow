// src/components/AccountantLayout.tsx

/**
 * 💰 ACCOUNTANT SYSTEM LAYOUT
 * 
 * Completely isolated layout for the accountant system.
 * NO client-side business features - only accounting and financial tools.
 * 
 * FEATURES:
 * - Financial dashboard and reporting
 * - Multi-client accounting oversight
 * - Tax preparation and compliance
 * - Banking and reconciliation tools
 * - Integration management (QuickBooks, Xero, etc.)
 * - Audit trail and compliance monitoring
 */

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CalculatorIcon,
  DocumentCheckIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  PresentationChartLineIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  CreditCardIcon,
  ArrowPathIcon,
  CloudIcon,
  LinkIcon,
  FolderIcon,
  BoltIcon,
  ShieldCheckIcon,
  ServerIcon,
  HeartIcon,
  UsersIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';

interface AccountantLayoutProps {
  children: ReactNode;
  title?: string;
}

const navigationSections = [
  {
    title: 'Financial Operations',
    items: [
      { name: 'Financial Dashboard', href: '/accountant', icon: ChartBarIcon },
      { name: 'General Ledger', href: '/accountant/ledger', icon: DocumentTextIcon },
      { name: 'Chart of Accounts', href: '/accountant/chart-accounts', icon: ClipboardDocumentListIcon },
      { name: 'Journal Entries', href: '/accountant/journal', icon: DocumentCheckIcon },
    ]
  },
  {
    title: 'Client Management',
    items: [
      { name: 'Client Portfolio', href: '/accountant/clients', icon: BuildingLibraryIcon },
      { name: 'Client Onboarding', href: '/accountant/onboarding', icon: UserGroupIcon },
      { name: 'Client Health Scores', href: '/accountant/health', icon: HeartIcon },
    ]
  },
  {
    title: 'Reporting & Analytics',
    items: [
      { name: 'Financial Reports', href: '/accountant/reports', icon: DocumentTextIcon },
      { name: 'Management Reports', href: '/accountant/management', icon: ChartBarIcon },
      { name: 'Variance Analysis', href: '/accountant/variance', icon: ArrowTrendingUpIcon },
      { name: 'KPI Dashboards', href: '/accountant/kpis', icon: PresentationChartLineIcon },
    ]
  },
  {
    title: 'Tax & Compliance',
    items: [
      { name: 'Tax Management', href: '/accountant/tax', icon: CalculatorIcon },
      { name: 'Sales Tax', href: '/accountant/sales-tax', icon: ReceiptPercentIcon },
      { name: 'Payroll Tax', href: '/accountant/payroll-tax', icon: UsersIcon },
      { name: 'Audit Trail', href: '/accountant/audit', icon: MagnifyingGlassIcon },
      { name: '1099 Management', href: '/accountant/1099', icon: DocumentIcon },
    ]
  },
  {
    title: 'Banking & Reconciliation',
    items: [
      { name: 'Bank Reconciliation', href: '/accountant/reconciliation', icon: BanknotesIcon },
      { name: 'Cash Management', href: '/accountant/cash', icon: CurrencyDollarIcon },
      { name: 'Payment Processing', href: '/accountant/payments', icon: CreditCardIcon },
      { name: 'Banking Connections', href: '/accountant/banking', icon: BuildingLibraryIcon },
    ]
  },
  {
    title: 'Integrations & Tools',
    items: [
      { name: 'QuickBooks Sync', href: '/accountant/quickbooks', icon: ArrowPathIcon },
      { name: 'Xero Integration', href: '/accountant/xero', icon: CloudIcon },
      { name: 'Banking APIs', href: '/accountant/banking-api', icon: LinkIcon },
      { name: 'Document Management', href: '/accountant/documents', icon: FolderIcon },
      { name: 'Workflow Automation', href: '/accountant/automation', icon: BoltIcon },
    ]
  },
  {
    title: 'System Administration',
    items: [
      { name: 'User Permissions', href: '/accountant/permissions', icon: ShieldCheckIcon },
      { name: 'Backup & Recovery', href: '/accountant/backup', icon: ServerIcon },
      { name: 'System Settings', href: '/accountant/settings', icon: CogIcon },
    ]
  }
];

export default function AccountantLayout({ children, title = 'StreamFlow Accountant Portal' }: AccountantLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
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

      {/* Futuristic Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl shadow-2xl border-r border-green-500/20">
        {/* Futuristic Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-green-500/20">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                <span className="text-2xl text-white">💰</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                FinanceCore
              </h1>
              <p className="text-sm text-green-400 font-medium tracking-wide">
                FINANCIAL MANAGEMENT
              </p>
            </div>
          </div>
        </div>

        {/* Futuristic Navigation */}
        <nav className="mt-6 px-6 pb-20 overflow-y-auto">
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
        </nav>

        {/* Futuristic User Info Panel */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-green-500/20 shadow-2xl shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl flex items-center justify-center border border-green-500/30">
                    <span className="text-green-400 font-bold text-sm">CPA</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">ACCOUNTANT</p>
                  <p className="text-xs text-green-400 font-mono">FINANCE.CORE</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-800 border border-green-500/30 text-green-400 rounded-lg hover:bg-slate-700 transition-all duration-300"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Main Content */}
      <div className="pl-72">
        {/* Futuristic Top Bar */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl shadow-2xl border-b border-green-500/20">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  {title}
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl backdrop-blur-sm">
                  <span className="text-green-400 text-sm font-mono font-bold">CPA CERTIFIED</span>
                </div>
                <div className="text-sm text-slate-400 font-mono">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Futuristic Page Content */}
        <main className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 relative min-h-screen">
          {/* Content Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
            }}></div>
          </div>

          <div className="relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

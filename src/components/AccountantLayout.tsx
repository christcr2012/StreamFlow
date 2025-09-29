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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl">💰</div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Accountant Portal</h1>
              <p className="text-xs text-gray-500">Financial Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 pb-20 overflow-y-auto">
          {navigationSections.map((section) => (
            <div key={section.title} className="mb-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? 'bg-green-100 text-green-900 border-r-2 border-green-500'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <item.icon
                        className={`
                          mr-3 h-4 w-4 flex-shrink-0
                          ${isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'}
                        `}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-medium text-sm">CPA</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Accountant</p>
                <p className="text-xs text-gray-500">accountant@streamflow.com</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <div className="flex items-center space-x-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  CPA Certified
                </span>
                <div className="text-sm text-gray-500">
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

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

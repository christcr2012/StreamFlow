/**
 * Cleaning Vertical Dashboard
 * 
 * Main dashboard for cleaning vertical showing key metrics and recent activity
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  activeContracts: number;
  scheduledWorkOrders: number;
  completedThisWeek: number;
  pendingInspections: number;
  revenue: {
    thisMonth: number;
    lastMonth: number;
  };
}

export default function CleaningDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real stats from API
    // For now, using placeholder data
    setStats({
      activeContracts: 12,
      scheduledWorkOrders: 8,
      completedThisWeek: 15,
      pendingInspections: 3,
      revenue: {
        thisMonth: 12500,
        lastMonth: 11200
      }
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cleaning Services</h1>
        <Link
          href="/cleaning/leads/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Lead
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Contracts</div>
          <div className="text-3xl font-bold mt-2">{stats?.activeContracts}</div>
          <Link href="/cleaning/contracts" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            View all →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Scheduled Work Orders</div>
          <div className="text-3xl font-bold mt-2">{stats?.scheduledWorkOrders}</div>
          <Link href="/cleaning/schedules" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            View schedule →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Completed This Week</div>
          <div className="text-3xl font-bold mt-2">{stats?.completedThisWeek}</div>
          <Link href="/cleaning/qa" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            View QA →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending Inspections</div>
          <div className="text-3xl font-bold mt-2">{stats?.pendingInspections}</div>
          <Link href="/cleaning/qa" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Review →
          </Link>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Revenue</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">This Month</div>
            <div className="text-2xl font-bold">${stats?.revenue.thisMonth.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Last Month</div>
            <div className="text-2xl font-bold">${stats?.revenue.lastMonth.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-green-600">
            +{Math.round(((stats!.revenue.thisMonth - stats!.revenue.lastMonth) / stats!.revenue.lastMonth) * 100)}% vs last month
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/cleaning/leads"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">Leads</div>
          </Link>
          <Link
            href="/cleaning/estimates"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium">Estimates</div>
          </Link>
          <Link
            href="/cleaning/contracts"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="font-medium">Contracts</div>
          </Link>
          <Link
            href="/cleaning/schedules"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-medium">Schedule</div>
          </Link>
          <Link
            href="/cleaning/qa"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium">QA</div>
          </Link>
          <Link
            href="/cleaning/billing"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">💳</div>
            <div className="font-medium">Billing</div>
          </Link>
          <Link
            href="/cleaning/analytics"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Analytics</div>
          </Link>
        </div>
      </div>
    </div>
  );
}


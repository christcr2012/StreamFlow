/**
 * Admin Dashboard Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState, useEffect } from "react";

interface DashboardStats {
  totalOrgs: number;
  activeOrgs: number;
  totalRevenue: number;
  mrrCents: number;
  churnRate: number;
  activeIncidents: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrgs: 0,
    activeOrgs: 0,
    totalRevenue: 0,
    mrrCents: 0,
    churnRate: 0,
    activeIncidents: 0,
  });

  // TODO Phase 2: Implement useSWR data fetching from multiple endpoints
  // TODO Phase 2: Fetch latest analytics snapshot
  // TODO Phase 2: Fetch org counts
  // TODO Phase 2: Fetch active incident count
  // TODO Phase 2: Fetch recent activity feed

  useEffect(() => {
    // Placeholder
  }, []);

  const statCards = [
    {
      label: "Total Organizations",
      value: stats.totalOrgs.toLocaleString(),
      icon: "🏢",
    },
    {
      label: "Active Organizations",
      value: stats.activeOrgs.toLocaleString(),
      icon: "✅",
    },
    {
      label: "Monthly Recurring Revenue",
      value: `$${(stats.mrrCents / 100).toLocaleString()}`,
      icon: "💰",
    },
    {
      label: "Total Revenue (All Time)",
      value: `$${(stats.totalRevenue / 100).toLocaleString()}`,
      icon: "📊",
    },
    {
      label: "Churn Rate",
      value: `${stats.churnRate.toFixed(1)}%`,
      icon: "📉",
    },
    {
      label: "Active Incidents",
      value: stats.activeIncidents.toLocaleString(),
      icon: "🚨",
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">
                  {card.label}
                </div>
                <div className="mt-2 text-3xl font-bold">{card.value}</div>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <button
            onClick={() => (window.location.href = "/admin/vertical-packs")}
            className="rounded border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-semibold">Manage Vertical Packs</div>
            <div className="text-sm text-gray-600">
              Add or edit industry verticals
            </div>
          </button>
          <button
            onClick={() => (window.location.href = "/admin/subscription-tiers")}
            className="rounded border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-2xl mb-2">💳</div>
            <div className="font-semibold">Subscription Tiers</div>
            <div className="text-sm text-gray-600">Configure pricing plans</div>
          </button>
          <button
            onClick={() => (window.location.href = "/admin/integrations")}
            className="rounded border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-2xl mb-2">🔌</div>
            <div className="font-semibold">Integrations</div>
            <div className="text-sm text-gray-600">
              Manage third-party connections
            </div>
          </button>
          <button
            onClick={() => (window.location.href = "/admin/feature-flags")}
            className="rounded border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-2xl mb-2">🚩</div>
            <div className="font-semibold">Feature Flags</div>
            <div className="text-sm text-gray-600">Control feature rollout</div>
          </button>
          <button
            onClick={() => (window.location.href = "/admin/pricing")}
            className="rounded border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-2xl mb-2">💵</div>
            <div className="font-semibold">Pricing Overrides</div>
            <div className="text-sm text-gray-600">Custom pricing rules</div>
          </button>
          <button
            onClick={() => (window.location.href = "/admin/infrastructure")}
            className="rounded border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-semibold">Infrastructure</div>
            <div className="text-sm text-gray-600">System health & limits</div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
        <div className="space-y-3">
          {/* TODO Phase 2: Load recent audit events */}
          <div className="text-center text-gray-500 py-8">
            No recent activity to display
          </div>
        </div>
      </div>

      {/* TODO Phase 2: Add charts (revenue trend, org growth, etc.) */}
      {/* TODO Phase 2: Add alerts/notifications section */}
      {/* TODO Phase 2: Add system health indicators */}
    </div>
  );
}

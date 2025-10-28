"use client";

import { useState } from "react";

// Phase 1 scaffold: Analytics dashboard
// TODO Phase 2: Implement useSWR from /api/analytics/snapshots
// TODO Phase 2: Add date range picker & charts

interface MetricCard {
  label: string;
  value: string | number;
  delta?: number; // percent change
}

export default function AnalyticsDashboardPage() {
  const [cards] = useState<MetricCard[]>([
    { label: "MRR", value: "$0" },
    { label: "ARR", value: "$0" },
    { label: "Active Customers", value: 0 },
    { label: "Churn Rate", value: "0%" },
  ]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        {/* TODO Phase 2: Date range picker */}
        <div className="rounded border px-3 py-2 text-sm text-gray-600">
          Last 30 days
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded border p-4">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="text-2xl font-semibold">{c.value}</div>
            {/* TODO Phase 2: Delta indicator */}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="mb-3 text-lg font-semibold">Revenue</h2>
          <div className="h-64 rounded bg-gray-50" />
          {/* TODO Phase 2: Line chart */}
        </div>
        <div className="rounded border p-4">
          <h2 className="mb-3 text-lg font-semibold">Customer Growth</h2>
          <div className="h-64 rounded bg-gray-50" />
          {/* TODO Phase 2: Area chart */}
        </div>
      </div>
    </div>
  );
}

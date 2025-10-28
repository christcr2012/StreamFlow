"use client";

import { useState } from "react";

// Phase 1 scaffold: Usage analytics
// TODO Phase 2: Implement useSWR from /api/usage-meters

interface FeatureUsage {
  feature: string;
  count: number;
}

export default function UsageReportPage() {
  const [usage] = useState<FeatureUsage[]>([]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Usage Analytics</h1>

      <div className="overflow-hidden rounded border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Feature
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {usage.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                  No usage recorded for the selected period.
                </td>
              </tr>
            ) : (
              usage.map((u) => (
                <tr key={u.feature} className="border-t">
                  <td className="px-4 py-2">{u.feature}</td>
                  <td className="px-4 py-2">{u.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

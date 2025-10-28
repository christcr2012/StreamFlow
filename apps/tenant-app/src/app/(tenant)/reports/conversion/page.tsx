"use client";

import { useState } from "react";

// Phase 1 scaffold: Conversion funnel
// TODO Phase 2: Implement useSWR from relevant endpoints

interface FunnelStep {
  label: string;
  count: number;
}

export default function ConversionReportPage() {
  const [steps] = useState<FunnelStep[]>([
    { label: "Leads", count: 0 },
    { label: "Opportunities", count: 0 },
    { label: "Customers", count: 0 },
  ]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Conversion Funnel</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s, idx) => (
          <div key={s.label} className="rounded border p-4">
            <div className="text-sm text-gray-500">Step {idx + 1}</div>
            <div className="text-xl font-semibold">{s.label}</div>
            <div className="mt-2 text-3xl font-bold">{s.count}</div>
          </div>
        ))}
      </div>

      {/* TODO Phase 2: Add drop-off analysis and source attribution */}
    </div>
  );
}

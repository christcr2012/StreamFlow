"use client";

import { useState } from "react";

// Phase 1 scaffold: Pipeline analytics
// TODO Phase 2: Implement useSWR aggregation from /api/opportunities

interface StageMetric {
  stage: string;
  count: number;
  avgValue: number;
  conversionRate?: number; // percent to next stage
}

export default function PipelineReportPage() {
  const [stages] = useState<StageMetric[]>([
    { stage: "New", count: 0, avgValue: 0 },
    { stage: "Qualified", count: 0, avgValue: 0 },
    { stage: "Proposal", count: 0, avgValue: 0 },
    { stage: "Negotiation", count: 0, avgValue: 0 },
    { stage: "Won", count: 0, avgValue: 0 },
  ]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Sales Pipeline</h1>

      <div className="overflow-hidden rounded border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Stage
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Count
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Avg Value
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Conversion
              </th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.stage} className="border-t">
                <td className="px-4 py-2">{s.stage}</td>
                <td className="px-4 py-2">{s.count}</td>
                <td className="px-4 py-2">${s.avgValue.toFixed(2)}</td>
                <td className="px-4 py-2">
                  {s.conversionRate ? `${s.conversionRate}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TODO Phase 2: Funnel chart visualization */}
    </div>
  );
}

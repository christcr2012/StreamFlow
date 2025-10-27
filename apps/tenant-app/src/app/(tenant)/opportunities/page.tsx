"use client";

/**
 * Opportunities CRM Page
 * Phase 1: Scaffold with TODO placeholders
 *
 * Displays opportunities in a kanban board view by stage
 */

import { useState } from "react";
import Link from "next/link";

type OpportunityStage =
  | "PROSPECTING"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

interface Opportunity {
  id: string;
  customerId: string;
  estValue: number | null;
  stage: string;
  ownerId: string | null;
  sourceLeadId: string | null;
  classification: any;
  createdAt: string;
  updatedAt: string;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO Phase 2: Implement useSWR for data fetching from /api/v2/opportunities
  // TODO Phase 2: Group opportunities by stage
  // TODO Phase 2: Implement drag-and-drop between stages
  // TODO Phase 2: Add opportunity detail modal/sidebar
  // TODO Phase 2: Add filtering by owner, date range, value
  // TODO Phase 2: Add total value per stage
  // TODO Phase 2: Add conversion rate analytics

  const stages: OpportunityStage[] = [
    "PROSPECTING",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "WON",
    "LOST",
  ];

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      PROSPECTING: "bg-gray-100 border-gray-300",
      QUALIFIED: "bg-blue-100 border-blue-300",
      PROPOSAL: "bg-yellow-100 border-yellow-300",
      NEGOTIATION: "bg-purple-100 border-purple-300",
      WON: "bg-green-100 border-green-300",
      LOST: "bg-red-100 border-red-300",
    };
    return colors[stage] || "bg-gray-100 border-gray-300";
  };

  const opportunitiesByStage = (stage: OpportunityStage) => {
    return opportunities.filter((opp) => opp.stage === stage);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track opportunities through your sales stages
            </p>
          </div>
          <Link
            href="/opportunities/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Opportunity
          </Link>
        </div>

        {/* TODO Phase 2: Add summary stats bar (total value, conversion rate, avg deal size) */}
        {/* TODO Phase 2: Add view toggle (kanban vs list vs chart) */}

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageOpps = opportunitiesByStage(stage);
            const stageValue = stageOpps.reduce(
              (sum, opp) => sum + (opp.estValue || 0),
              0,
            );

            return (
              <div
                key={stage}
                className="flex min-w-[300px] flex-1 flex-col rounded-lg border-2 bg-white shadow-sm"
                style={{ minHeight: "500px" }}
              >
                {/* Stage Header */}
                <div
                  className={`rounded-t-lg border-b-2 p-4 ${getStageColor(stage)}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {stage.replace("_", " ")}
                    </h3>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-700">
                      {stageOpps.length}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-700">
                    {formatCurrency(stageValue)}
                  </div>
                </div>

                {/* Opportunities List */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {loading ? (
                    <div className="text-center text-sm text-gray-500">
                      Loading...
                    </div>
                  ) : stageOpps.length === 0 ? (
                    <div className="text-center text-sm text-gray-400">
                      No opportunities
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <Link
                        key={opp.id}
                        href={`/opportunities/${opp.id}`}
                        className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* TODO Phase 2: Add customer name (join with Customer) */}
                        <div className="mb-2 font-medium text-gray-900">
                          Customer #{opp.customerId.slice(0, 8)}
                        </div>
                        <div className="mb-2 text-lg font-bold text-green-600">
                          {formatCurrency(opp.estValue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {new Date(opp.createdAt).toLocaleDateString()}
                        </div>
                        {/* TODO Phase 2: Add owner avatar/name */}
                        {/* TODO Phase 2: Add days in stage indicator */}
                        {/* TODO Phase 2: Add activity indicator (recent notes, emails) */}
                      </Link>
                    ))
                  )}
                </div>

                {/* TODO Phase 2: Add drop zone indicator for drag-and-drop */}
              </div>
            );
          })}
        </div>

        {/* TODO Phase 2: Add filters panel (owner, date range, value range) */}
        {/* TODO Phase 2: Add export to CSV */}
        {/* TODO Phase 2: Add bulk actions (assign, delete, change stage) */}
      </div>
    </div>
  );
}

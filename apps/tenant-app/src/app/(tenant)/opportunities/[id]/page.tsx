/**
 * Opportunity Detail Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Opportunity {
  id: string;
  customerId: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string | null;
  description: string | null;
  createdAt: string;
  Customer: {
    id: string;
    company: string;
  };
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const oppId = params.id as string;

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  // TODO Phase 2: Implement useSWR data fetching from /api/opportunities/[id]
  // TODO Phase 2: Add stage progression UI (drag to move stages)
  // TODO Phase 2: Add activity timeline (notes, emails, calls)
  // TODO Phase 2: Add products/line items table
  // TODO Phase 2: Add related quote/proposal documents
  // TODO Phase 2: Add win/loss reason capture

  useEffect(() => {
    setLoading(false);
  }, [oppId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading opportunity...</div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Opportunity not found
        </div>
      </div>
    );
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      PROSPECTING: "bg-gray-100 text-gray-800",
      QUALIFIED: "bg-blue-100 text-blue-800",
      PROPOSAL: "bg-purple-100 text-purple-800",
      NEGOTIATION: "bg-yellow-100 text-yellow-800",
      WON: "bg-green-100 text-green-800",
      LOST: "bg-red-100 text-red-800",
    };
    return colors[stage] || colors.PROSPECTING;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="mb-2 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Opportunities
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{opp.title}</h1>
            <p className="text-gray-600">{opp.Customer.company}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              ${(opp.value / 100).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {opp.probability}% probability
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Stage</h2>
        <div className="flex items-center justify-between">
          {["PROSPECTING", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON"].map(
            (stage, idx) => (
              <div key={stage} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full ${
                      stage === opp.stage
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    } flex items-center justify-center text-sm font-semibold`}
                  >
                    {idx + 1}
                  </div>
                  <div className="mt-2 text-xs font-medium">{stage}</div>
                </div>
                {idx < 4 && <div className="mx-2 h-1 flex-1 bg-gray-200"></div>}
              </div>
            ),
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Details Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Stage</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStageColor(
                    opp.stage,
                  )}`}
                >
                  {opp.stage}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Expected Close Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {opp.expectedCloseDate
                  ? new Date(opp.expectedCloseDate).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(opp.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {opp.description || "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Actions</h2>
          <div className="space-y-2">
            <button className="w-full rounded border border-gray-300 px-4 py-2 text-left hover:bg-gray-50">
              Move to Next Stage →
            </button>
            <button className="w-full rounded border border-gray-300 px-4 py-2 text-left hover:bg-gray-50">
              📧 Send Quote
            </button>
            <button className="w-full rounded border border-gray-300 px-4 py-2 text-left hover:bg-gray-50">
              📝 Add Note
            </button>
            <button className="w-full rounded border border-gray-300 px-4 py-2 text-left hover:bg-gray-50">
              📞 Log Activity
            </button>
            <button className="w-full rounded border border-green-300 bg-green-50 px-4 py-2 text-left hover:bg-green-100">
              ✅ Mark as Won
            </button>
            <button className="w-full rounded border border-red-300 bg-red-50 px-4 py-2 text-left hover:bg-red-100">
              ❌ Mark as Lost
            </button>
          </div>
        </div>
      </div>

      {/* TODO Phase 2: Add Products/Line Items section */}
      {/* TODO Phase 2: Add Activity Timeline section */}
      {/* TODO Phase 2: Add Files/Documents section */}
      {/* TODO Phase 2: Add Competitors section */}
    </div>
  );
}

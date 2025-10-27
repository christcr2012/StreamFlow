/**
 * Subscription Tiers Admin Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState } from "react";

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  billingCycle: string;
  isActive: boolean;
  features: string[];
}

export default function SubscriptionTiersPage() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);

  // TODO Phase 2: Implement useSWR data fetching from /api/subscription-tiers
  // TODO Phase 2: Add create tier modal
  // TODO Phase 2: Add edit tier modal with feature checkboxes
  // TODO Phase 2: Add delete confirmation
  // TODO Phase 2: Add regional pricing management

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscription Tiers</h1>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => {
            // TODO Phase 2: Open create modal
          }}
        >
          Add Tier
        </button>
      </div>

      {/* Tiers Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.length === 0 ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
            <div className="text-gray-500">
              No subscription tiers configured. Add your first tier to get
              started.
            </div>
          </div>
        ) : (
          tiers.map((tier) => (
            <div
              key={tier.id}
              className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow hover:border-blue-300"
            >
              <div className="mb-4 text-center">
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <p className="text-sm text-gray-500">{tier.slug}</p>
              </div>

              <div className="mb-6 text-center">
                <div className="text-4xl font-bold text-blue-600">
                  ${(tier.basePrice / 100).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  per {tier.billingCycle}
                </div>
              </div>

              <p className="mb-6 text-center text-sm text-gray-600">
                {tier.description || "—"}
              </p>

              <div className="mb-6 space-y-2">
                <div className="text-sm font-semibold text-gray-700">
                  Features:
                </div>
                {tier.features.length > 0 ? (
                  tier.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <span className="mr-2">✓</span>
                      {feature}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    No features listed
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    // TODO Phase 2: Open edit modal
                  }}
                  className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Edit Tier
                </button>
                <button
                  onClick={() => {
                    // TODO Phase 2: Show delete confirmation
                  }}
                  className="rounded border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span
                  className={`inline-flex w-full justify-center rounded-full px-2 py-1 text-xs font-semibold ${
                    tier.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {tier.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TODO Phase 2: Add tier comparison table */}
      {/* TODO Phase 2: Add subscriber count per tier */}
      {/* TODO Phase 2: Add revenue breakdown per tier */}
    </div>
  );
}

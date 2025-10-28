"use client";

/**
 * Feature Flags Admin Page
 * Phase 1: Scaffold with TODO placeholders
 */

import { useState } from "react";

interface FeatureFlag {
  id: string;
  orgId: string | null;
  key: string;
  isEnabled: boolean;
  rolloutPercent: number;
  conditions: any;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO Phase 2: Implement useSWR for data fetching from /api/feature-flags
  // TODO Phase 2: Add toggle functionality (enable/disable flags)
  // TODO Phase 2: Add percentage rollout slider
  // TODO Phase 2: Add conditions editor (user segments, org tiers, etc.)
  // TODO Phase 2: Add flag creation modal
  // TODO Phase 2: Add flag usage analytics (how many orgs/users affected)
  // TODO Phase 2: Add flag audit log (who changed what when)

  const handleToggle = async (flagId: string, currentState: boolean) => {
    // TODO Phase 2: Call API to toggle flag
    console.log("Toggle flag:", flagId, "→", !currentState);
  };

  const handleRolloutChange = async (flagId: string, percent: number) => {
    // TODO Phase 2: Call API to update rollout percentage
    console.log("Update rollout:", flagId, "→", percent, "%");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
            <p className="mt-1 text-sm text-gray-500">
              Control feature rollout and A/B testing
            </p>
          </div>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => {
              // TODO Phase 2: Open create flag modal
            }}
          >
            + New Flag
          </button>
        </div>

        {/* TODO Phase 2: Add search/filter bar */}
        {/* TODO Phase 2: Add flag category tabs (global, org-specific, user-specific) */}

        {/* Flags List */}
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <div className="text-gray-500">Loading feature flags...</div>
            </div>
          ) : flags.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <p className="mb-2 text-lg font-medium text-gray-700">
                No feature flags yet
              </p>
              <p className="text-sm text-gray-500">
                Create your first feature flag to start controlling rollouts.
              </p>
            </div>
          ) : (
            flags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {flag.key}
                      </h3>
                      {/* Enable/Disable Toggle */}
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={flag.isEnabled}
                          onChange={() => handleToggle(flag.id, flag.isEnabled)}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300"></div>
                      </label>
                      <span
                        className={`text-sm font-medium ${
                          flag.isEnabled ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {flag.isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    {/* Scope Badge */}
                    <div className="mt-2">
                      {flag.orgId ? (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          Org-Specific
                        </span>
                      ) : (
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                          Global
                        </span>
                      )}
                    </div>

                    {/* Rollout Percentage */}
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Rollout Percentage
                        </span>
                        <span className="font-medium text-gray-900">
                          {flag.rolloutPercent}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={flag.rolloutPercent}
                        onChange={(e) =>
                          handleRolloutChange(flag.id, parseInt(e.target.value))
                        }
                        className="w-full"
                        disabled={!flag.isEnabled}
                      />
                    </div>

                    {/* TODO Phase 2: Add conditions display (user segments, tiers) */}
                    {/* TODO Phase 2: Add affected users count */}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex gap-2">
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        // TODO Phase 2: Open edit modal
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm text-red-600 hover:text-red-800"
                      onClick={() => {
                        // TODO Phase 2: Confirm and delete flag
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-4 text-xs text-gray-500">
                  Created {new Date(flag.createdAt).toLocaleDateString()} •
                  Updated {new Date(flag.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* TODO Phase 2: Add pagination if many flags */}
      </div>
    </div>
  );
}

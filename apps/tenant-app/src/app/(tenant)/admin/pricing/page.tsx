/**
 * Pricing Overrides Admin Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState } from "react";

interface PricingOverride {
  id: string;
  targetOrgId: string;
  resourceType: string;
  resourceId: string;
  overridePrice: number;
  discountPercent: number | null;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function PricingOverridesPage() {
  const [overrides, setOverrides] = useState<PricingOverride[]>([]);
  const [search, setSearch] = useState("");

  // TODO Phase 2: Implement useSWR data fetching from /api/pricing/overrides
  // TODO Phase 2: Add create override modal
  // TODO Phase 2: Add edit override modal
  // TODO Phase 2: Add delete confirmation
  // TODO Phase 2: Add filter by org, resource type, active/expired

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pricing Overrides</h1>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => {
            // TODO Phase 2: Open create modal
          }}
        >
          Add Override
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by org ID or resource..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-gray-300 px-4 py-2"
        />
      </div>

      {/* Overrides Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Target Org
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Override Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Expires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {overrides.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No pricing overrides configured.
                </td>
              </tr>
            ) : (
              overrides.map((override) => (
                <tr key={override.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {override.targetOrgId}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <div>{override.resourceType}</div>
                    <div className="text-xs text-gray-400">
                      {override.resourceId}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ${(override.overridePrice / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {override.discountPercent
                      ? `${override.discountPercent}%`
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {override.expiresAt
                      ? new Date(override.expiresAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {override.reason || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        // TODO Phase 2: Open edit modal
                      }}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        // TODO Phase 2: Show delete confirmation
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TODO Phase 2: Add pagination */}
      {/* TODO Phase 2: Add bulk actions */}
      {/* TODO Phase 2: Add override creation/edit modal */}
      {/* TODO Phase 2: Add audit log of override changes */}
    </div>
  );
}

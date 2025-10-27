/**
 * Integrations Admin Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState } from "react";

interface Integration {
  id: string;
  orgId: string;
  provider: string;
  status: string;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function IntegrationsAdminPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filter, setFilter] = useState<
    "all" | "connected" | "error" | "disconnected"
  >("all");

  // TODO Phase 2: Implement useSWR data fetching from /api/integrations (admin view - all orgs)
  // TODO Phase 2: Add filter by provider
  // TODO Phase 2: Add search by org ID
  // TODO Phase 2: Add sync status indicators
  // TODO Phase 2: Add manual resync trigger

  const providers = [
    { name: "Google", icon: "🔵", slug: "google" },
    { name: "Microsoft", icon: "🟦", slug: "microsoft" },
    { name: "Slack", icon: "💬", slug: "slack" },
    { name: "Salesforce", icon: "☁️", slug: "salesforce" },
    { name: "HubSpot", icon: "🟠", slug: "hubspot" },
    { name: "QuickBooks", icon: "🟢", slug: "quickbooks" },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Integrations Management</h1>

      {/* Provider Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-3 lg:grid-cols-6">
        {providers.map((provider) => (
          <div
            key={provider.slug}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow text-center"
          >
            <div className="text-3xl mb-2">{provider.icon}</div>
            <div className="text-sm font-semibold">{provider.name}</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {/* TODO Phase 2: Count connected orgs per provider */}0
            </div>
            <div className="text-xs text-gray-500">connections</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {(["all", "connected", "error", "disconnected"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded px-4 py-2 text-sm font-medium ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ),
        )}
      </div>

      {/* Integrations Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Org ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Last Sync
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Error
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {integrations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No integrations found for this filter.
                </td>
              </tr>
            ) : (
              integrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {integration.orgId}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {integration.provider}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        integration.status === "connected"
                          ? "bg-green-100 text-green-800"
                          : integration.status === "error"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {integration.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {integration.lastSyncAt
                      ? new Date(integration.lastSyncAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {integration.errorMessage || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        // TODO Phase 2: Trigger manual resync
                      }}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      Resync
                    </button>
                    <button
                      onClick={() => {
                        // TODO Phase 2: View integration details
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TODO Phase 2: Add pagination */}
      {/* TODO Phase 2: Add bulk resync action */}
      {/* TODO Phase 2: Add integration health dashboard */}
      {/* TODO Phase 2: Add sync logs/audit trail */}
    </div>
  );
}

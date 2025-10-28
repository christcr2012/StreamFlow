"use client";

import { useState } from "react";

// Phase 1 scaffold: Import job history
// TODO Phase 2: Implement useSWR from /api/import/jobs

interface ImportJob {
  id: string;
  entityType: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  errorCount?: number;
}

const mockRows: ImportJob[] = [];

export default function ImportHistoryPage() {
  const [rows] = useState<ImportJob[]>(mockRows);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Import History</h1>
        <a
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          href="/import/mappings"
        >
          Manage Mappings
        </a>
      </div>

      <div className="overflow-hidden rounded border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Entity
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Created
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Completed
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Errors
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No import jobs yet.
                </td>
              </tr>
            ) : (
              rows.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">{it.entityType}</td>
                  <td className="px-4 py-2 capitalize">{it.status}</td>
                  <td className="px-4 py-2">
                    {new Date(it.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {it.completedAt
                      ? new Date(it.completedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{it.errorCount ?? 0}</td>
                  <td className="px-4 py-2 text-right">
                    {/* TODO Phase 2: Link to details (download error report) */}
                    <button className="rounded bg-gray-100 px-3 py-1 text-xs">
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

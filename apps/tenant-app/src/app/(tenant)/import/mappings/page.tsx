"use client";

import { useState } from "react";

// Phase 1 scaffold: Import mappings management
// TODO Phase 2: Implement useSWR from /api/import/mappings

interface ImportMapping {
  id: string;
  name: string;
  entityType: string;
  createdAt: string;
  updatedAt: string;
}

const mockRows: ImportMapping[] = [];

export default function ImportMappingsPage() {
  const [rows] = useState<ImportMapping[]>(mockRows);
  const [filter, setFilter] = useState<string>("");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Import Mappings</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          New Mapping
        </button>
      </div>

      <div className="mb-4">
        <input
          className="w-full rounded border px-3 py-2 md:w-64"
          placeholder="Filter by entity type"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Entity
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Updated
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No mappings yet.
                </td>
              </tr>
            ) : (
              rows.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">{it.name}</td>
                  <td className="px-4 py-2">{it.entityType}</td>
                  <td className="px-4 py-2">
                    {new Date(it.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {/* TODO Phase 2: Edit/Delete actions, preview mapping */}
                    <div className="flex justify-end gap-2">
                      <button className="rounded bg-gray-100 px-3 py-1 text-xs">
                        Edit
                      </button>
                      <button className="rounded bg-red-600 px-3 py-1 text-xs text-white">
                        Delete
                      </button>
                    </div>
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

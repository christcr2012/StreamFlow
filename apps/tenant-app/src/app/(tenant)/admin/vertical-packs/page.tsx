/**
 * Vertical Packs Admin Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState } from "react";

interface VerticalPack {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
}

export default function VerticalPacksPage() {
  const [packs, setPacks] = useState<VerticalPack[]>([]);
  const [loading, setLoading] = useState(false);

  // TODO Phase 2: Implement useSWR data fetching from /api/vertical-packs
  // TODO Phase 2: Add create pack modal
  // TODO Phase 2: Add edit pack modal
  // TODO Phase 2: Add delete confirmation
  // TODO Phase 2: Add enable/disable toggle

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vertical Packs</h1>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => {
            // TODO Phase 2: Open create modal
          }}
        >
          Add Vertical Pack
        </button>
      </div>

      {/* Packs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packs.length === 0 ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
            <div className="text-gray-500">
              No vertical packs configured. Add your first pack to get started.
            </div>
          </div>
        ) : (
          packs.map((pack) => (
            <div
              key={pack.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{pack.name}</h3>
                  <p className="text-sm text-gray-500">{pack.slug}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    pack.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {pack.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                {pack.description || "—"}
              </p>

              <div className="mb-4 text-2xl font-bold text-green-600">
                ${(pack.basePrice / 100).toLocaleString()}/mo
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // TODO Phase 2: Open edit modal
                  }}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Edit
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
            </div>
          ))
        )}
      </div>

      {/* TODO Phase 2: Add pack feature checklist management */}
      {/* TODO Phase 2: Add usage analytics per pack */}
      {/* TODO Phase 2: Add pack dependencies/conflicts */}
    </div>
  );
}

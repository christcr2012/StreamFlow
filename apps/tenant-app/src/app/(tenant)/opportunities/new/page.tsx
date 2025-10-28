/**
 * Opportunities New Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOpportunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    title: "",
    value: "",
    stage: "PROSPECTING" as const,
    probability: 0,
    expectedCloseDate: "",
    description: "",
    ownerId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO Phase 2: Implement POST to /api/opportunities
    // TODO Phase 2: Add validation (customer required, value > 0, etc.)
    // TODO Phase 2: Show success toast
    // TODO Phase 2: Navigate to opportunity detail page

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Opportunities
        </button>
        <h1 className="text-3xl font-bold">Create Opportunity</h1>
      </div>

      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) =>
                setFormData({ ...formData, customerId: e.target.value })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select customer...</option>
              {/* TODO Phase 2: Load customers from API */}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              required
            />
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estimated Value *
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                className="w-full rounded border border-gray-300 px-3 py-2 pl-7"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stage *
            </label>
            <select
              value={formData.stage}
              onChange={(e) =>
                setFormData({ ...formData, stage: e.target.value as any })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="PROSPECTING">Prospecting</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          {/* Probability */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Probability (%)
            </label>
            <input
              type="number"
              value={formData.probability}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  probability: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              min="0"
              max="100"
            />
          </div>

          {/* Expected Close Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Expected Close Date
            </label>
            <input
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) =>
                setFormData({ ...formData, expectedCloseDate: e.target.value })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              rows={4}
            />
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Owner
            </label>
            <select
              value={formData.ownerId}
              onChange={(e) =>
                setFormData({ ...formData, ownerId: e.target.value })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Unassigned</option>
              {/* TODO Phase 2: Load team members from API */}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Opportunity"}
            </button>
          </div>
        </form>
      </div>

      {/* TODO Phase 2: Add products/line items section */}
      {/* TODO Phase 2: Add custom fields support */}
      {/* TODO Phase 2: Add attachments upload */}
    </div>
  );
}

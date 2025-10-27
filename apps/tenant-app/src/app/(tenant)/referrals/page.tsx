"use client";

import { useState } from "react";

// Phase 1 scaffold: Referrals list page
// TODO Phase 2: Implement useSWR from /api/referrals
// TODO Phase 2: Add conversion tracking actions

interface ReferralItem {
  id: string;
  referrerName: string;
  referredName: string;
  status: "pending" | "contacted" | "converted";
  createdAt: string;
  updatedAt: string;
  rewardAmount?: number;
}

const mockRows: ReferralItem[] = [];

export default function ReferralsPage() {
  const [rows] = useState<ReferralItem[]>(mockRows);
  const [status, setStatus] = useState<string>("");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Referrals</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          New Referral
        </button>
      </div>

      <div className="mb-4">
        <select
          className="w-full rounded border px-3 py-2 md:w-64"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div className="overflow-hidden rounded border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Referrer
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Referred
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Reward
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No referrals yet.
                </td>
              </tr>
            ) : (
              rows.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">{it.referrerName}</td>
                  <td className="px-4 py-2">{it.referredName}</td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium capitalize">
                      {it.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {it.rewardAmount ? `$${it.rewardAmount.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(it.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {/* TODO Phase 2: Actions - Mark Contacted / Mark Converted */}
                    <div className="flex justify-end gap-2">
                      <button className="rounded bg-gray-100 px-3 py-1 text-xs">
                        Contacted
                      </button>
                      <button className="rounded bg-green-600 px-3 py-1 text-xs text-white">
                        Converted
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

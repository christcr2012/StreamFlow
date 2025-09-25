// src/pages/leads.tsx
import { useEffect, useState } from "react";
import Head from "next/head";

type LeadRow = {
  id: string;
  publicId: string | null;
  sourceType: string | null;
  sourceDetail?: string | null;
  company: string | null;
  contactName: string | null;
  email: string | null;
  phoneE164: string | null;
  serviceCode: string | null;
  postalCode: string | null;
  zip: string | null;
  aiScore: number | null;
  /** Whether this lead was created by the system (e.g. SAM.gov import). */
  systemGenerated?: boolean | null;
  /** Date/time when lead was converted; used to compute billable status */
  convertedAt?: string | null;
  status: string | null;
  createdAt: string | null;
  // Pass-through enrichmentJson to access billing metadata
  // Use a loose record type instead of any
  enrichmentJson?: Record<string, unknown> | null;
};

/**
 * Determine if a lead should be billed. A lead is billable if it was
 * system-generated (e.g. imported from SAM.gov) and has been marked
 * converted. Fallback to the old heuristic if the systemGenerated flag is
 * missing.
 */
function isBillable(l: LeadRow) {
  // New billing rules: a lead is billable if it's converted and marked billableEligible
  const ej = (l.enrichmentJson ?? {}) as Record<string, unknown>;
  const billing = typeof ej.billing === "object" && ej.billing !== null ? (ej.billing as Record<string, unknown>) : {};
  const billableEligible = typeof billing.billableEligible === "boolean" ? billing.billableEligible : false;
  const billedAt = typeof billing.billedAt === "string" ? billing.billedAt : null;
  return billableEligible && !billedAt;
}

export default function LeadsPage() {
  const [items, setItems] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Sorting: scoreDesc, scoreAsc, date
  const [sortBy, setSortBy] = useState<"scoreDesc" | "scoreAsc" | "date">("scoreDesc");
  // Filtering: all, hot, cold
  const [filterBy, setFilterBy] = useState<"all" | "hot" | "cold">("all");

  useEffect(() => {
    async function run() {
      setLoading(true);
      const r = await fetch("/api/leads.list?page=1&pageSize=50");
      const j = await r.json();
      setItems(j?.items || []);
      setLoading(false);
    }
    run();
  }, []);

  // Apply sorting and filtering to items
  const processed = items
    .filter((l) => {
      if (filterBy === "hot") {
        return typeof l.aiScore === "number" && l.aiScore >= 70;
      }
      if (filterBy === "cold") {
        return typeof l.aiScore === "number" && l.aiScore < 70;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "scoreDesc") {
        return (b.aiScore ?? 0) - (a.aiScore ?? 0);
      }
      if (sortBy === "scoreAsc") {
        return (a.aiScore ?? 0) - (b.aiScore ?? 0);
      }
      // default sort by createdAt descending
      const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dB - dA;
    });

  return (
    <>
      <Head><title>Leads</title></Head>
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Leads</h1>

        {/* Sorting and filtering controls */}
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "scoreDesc" | "scoreAsc" | "date")}
              className="border rounded px-2 py-1"
            >
              <option value="scoreDesc">Score (high→low)</option>
              <option value="scoreAsc">Score (low→high)</option>
              <option value="date">Created (newest)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filter</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as "all" | "hot" | "cold")}
              className="border rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="hot">Hot (score ≥ 70)</option>
              <option value="cold">Cold (score &lt; 70)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Public ID</th>
                <th className="px-3 py-2 text-left">Company</th>
                <th className="px-3 py-2 text-left">Service</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left">Billable</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {!loading && processed.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                    No leads yet.
                  </td>
                </tr>
              )}
              {processed.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-3 py-2">{l.publicId || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{l.company || "—"}</div>
                    {l.sourceDetail && (
                      <div className="text-xs text-gray-500">{l.sourceDetail}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">{l.serviceCode || "—"}</td>
                  <td className="px-3 py-2">
                    {typeof l.aiScore === "number" ? (
                      <span className="inline-block rounded-md px-2 py-0.5 bg-gray-900 text-white">
                        {l.aiScore}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {isBillable(l) ? (
                      <span className="inline-block rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-block rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{l.status || "—"}</td>
                  <td className="px-3 py-2">
                    {l.createdAt ? new Date(l.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
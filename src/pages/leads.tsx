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
      <Head><title>Leads Database</title></Head>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Leads Database</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {processed.length} lead{processed.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex gap-4">
            <button className="btn-secondary">
              <span>Export</span>
            </button>
            <button className="btn-primary">
              <span>New Lead</span>
            </button>
          </div>
        </div>

        {/* Premium Controls */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Filter & Sort</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Customize your lead view</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "scoreDesc" | "scoreAsc" | "date")}
                className="input-field"
              >
                <option value="scoreDesc">Score (High → Low)</option>
                <option value="scoreAsc">Score (Low → High)</option>
                <option value="date">Created (Newest First)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Filter by Quality
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as "all" | "hot" | "cold")}
                className="input-field"
              >
                <option value="all">All Leads</option>
                <option value="hot">🔥 Hot Leads (Score 70+)</option>
                <option value="cold">❄️ Cold Leads (Score Under 70)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Premium Data Table */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
              <div>
                <h2 className="text-xl font-semibold text-gradient">Lead Pipeline</h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Complete lead management overview
                </p>
              </div>
            </div>
            
            {loading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Company</th>
                  <th>Service</th>
                  <th>AI Score</th>
                  <th>Status</th>
                  <th>Billable</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {!loading && processed.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="space-y-2">
                        <div className="text-lg" style={{ color: 'var(--text-tertiary)' }}>
                          No leads found
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Try adjusting your filters or add new leads
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {processed.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="font-mono text-sm" style={{ color: 'var(--brand-primary)' }}>
                        {l.publicId || "—"}
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <div className="font-medium">{l.company || "—"}</div>
                        {l.sourceDetail && (
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {l.sourceDetail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{l.serviceCode || "—"}</td>
                    <td>
                      {typeof l.aiScore === "number" ? (
                        <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                          l.aiScore >= 70 ? 'bg-green-500/20 text-green-400' :
                          l.aiScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {l.aiScore}%
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>
                    <td>{l.status || "—"}</td>
                    <td>
                      {isBillable(l) ? (
                        <div className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                          ✓ Yes
                        </div>
                      ) : (
                        <div className="inline-flex px-2 py-1 rounded text-xs" style={{ background: 'var(--surface-2)', color: 'var(--text-tertiary)' }}>
                          No
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
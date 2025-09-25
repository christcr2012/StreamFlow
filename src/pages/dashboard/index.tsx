// src/pages/dashboard/index.tsx
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useMe } from "@/lib/useMe";

type LeadRow = {
  id: string;
  publicId: string | null;
  sourceType: string;
  company: string | null;
  contactName: string | null;
  email: string | null;
  phoneE164: string | null;
  serviceCode: string | null;
  postalCode: string | null;
  zip: string | null;
  aiScore: number | null;
  status: string | null;
  createdAt: string | null;
};

type ApiListResponse = {
  ok: boolean;
  total: number;
  page: number;
  pageSize: number;
  items: LeadRow[];
  error?: string;
};

function fmtDate(s: string) {
  try { return new Date(s).toLocaleString(); } catch { return s; }
}

type SummaryKpis = {
  totalLeads90d: number;
  converted90d: number;
  rfp90d: number;
  hot90d: number;
  cold90d: number;
  monthBillableCount: number;
  monthBillableAmountUSD: number;
  periodStartISO?: string;
  periodEndISO?: string;
};

export default function Dashboard() {
  const [q, setQ] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [postal, setPostal] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);

  const { me } = useMe();
  const rbac: string[] =
    (me?.rbacRoles as string[]) ||
    (me?.perms as string[]) ||
    (Array.isArray((me as any)?.roles) ? (me as any).roles : []) ||
    [];
  const canManageBilling = rbac.includes("billing:manage") || rbac.includes("BILLING_MANAGE");

  const [kpis, setKpis] = useState<SummaryKpis | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (sourceType) params.set("sourceType", sourceType);
      if (postal) params.set("postal", postal);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/leads.list?${params.toString()}`);
      const data: ApiListResponse = await res.json();
      if (!data.ok) throw new Error(data.error || "Load failed");
      setRows(data.items);
      setTotal(data.total);
    } catch (e: unknown) {
      const errObj = e as { message?: string } | undefined;
      setError(errObj?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sourceType, postal, from, to, page, pageSize]);

  async function fetchSummary() {
    try {
      const r = await fetch("/api/dashboard/summary");
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
      setKpis(j.kpis as SummaryKpis);
    } catch (e: unknown) {
      const errObj = e as { message?: string } | undefined;
      setSummaryError(errObj?.message || "Failed to load summary");
    }
  }

  useEffect(() => {
    fetchSummary();
    const t = window.setInterval(fetchSummary, 30_000);
    return () => window.clearInterval(t);
  }, []);

  const billableCount = kpis?.monthBillableCount ?? 0;
  const projectedAmount = Number(kpis?.monthBillableAmountUSD ?? 0);
  const periodStartLabel = kpis?.periodStartISO ? new Date(kpis.periodStartISO).toLocaleDateString() : undefined;
  const periodEndLabel = kpis?.periodEndISO ? new Date(kpis.periodEndISO).toLocaleDateString() : undefined;

  return (
    <>
      <Head><title>Dashboard</title></Head>
      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 12 }}>Dashboard</h1>

        {/* Billing summary (original, uses KPIs) */}
        <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Conversion-Based Billing</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
            This Month: {billableCount} converted (billable)
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            Invoice draft preview: {billableCount} × $100 = ${projectedAmount.toFixed(2)}
          </div>
          {periodStartLabel && periodEndLabel && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              Period: {periodStartLabel} → {periodEndLabel}
            </div>
          )}
          {!canManageBilling && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
              Note: You don't have billing permissions. Some actions may be hidden.
            </div>
          )}
        </div>

        {/* KPI cards */}
        {summaryError && (
          <div style={{ color: "crimson", marginBottom: 16 }}>Error loading summary: {summaryError}</div>
        )}
        {kpis && (
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Leads (90d)</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{kpis.totalLeads90d}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Converted (90d)</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{kpis.converted90d}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666" }}>RFP Leads (90d)</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{kpis.rfp90d}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Hot Leads (90d)</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{kpis.hot90d}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Cold Leads (90d)</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{kpis.cold90d}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Billable Conversions (mo)</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{kpis.monthBillableCount}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                Projected invoice: ${Number(kpis.monthBillableAmountUSD).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 180px 160px 160px 160px 120px 120px",
            gap: 8,
            alignItems: "end",
            marginBottom: 16,
          }}
        >
          <div>
            <label>Search</label>
            <input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              placeholder="company, contact, email, phone, service..."
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Source Type</label>
            <input
              value={sourceType}
              onChange={(e) => { setPage(1); setSourceType(e.target.value); }}
              placeholder="e.g. MANUAL_OTHER"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Postal/ZIP</label>
            <input
              value={postal}
              onChange={(e) => { setPage(1); setPostal(e.target.value); }}
              placeholder="e.g. 80631"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>From (YYYY-MM-DD)</label>
            <input
              value={from}
              onChange={(e) => { setPage(1); setFrom(e.target.value); }}
              placeholder="2025-01-01"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>To (YYYY-MM-DD)</label>
            <input
              value={to}
              onChange={(e) => { setPage(1); setTo(e.target.value); }}
              placeholder="2025-12-31"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Page size</label>
            <input
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(Number(e.target.value) || 20); }}
              placeholder="20"
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <button onClick={() => { setPage(1); load(); }} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ marginBottom: 12 }}>
          <b>Total:</b> {total} &nbsp;•&nbsp; <b>Page:</b> {page} / {Math.max(1, Math.ceil(total / pageSize))}
        </div>

        {error && (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            Error: {error}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 8 }}>
          <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
            <thead style={{ background: "#fafafa" }}>
              <tr>
                <th align="left">Public ID</th>
                <th align="left">Source</th>
                <th align="left">Company</th>
                <th align="left">Contact</th>
                <th align="left">Email</th>
                <th align="left">Phone</th>
                <th align="left">Service</th>
                <th align="left">Postal/ZIP</th>
                <th align="right">Score</th>
                <th align="left">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} align="center" style={{ padding: 24, color: "#999" }}>
                    No results for these filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                    <td>{r.publicId}</td>
                    <td>{r.sourceType}</td>
                    <td>{r.company}</td>
                    <td>{r.contactName}</td>
                    <td>{r.email}</td>
                    <td>{r.phoneE164}</td>
                    <td>{r.serviceCode}</td>
                    <td>{r.postalCode ?? r.zip ?? ""}</td>
                    <td align="right">{r.aiScore ?? ""}</td>
                    <td>{r.createdAt ? fmtDate(r.createdAt) : ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ◀ Prev
          </button>
          <button disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next ▶
          </button>
        </div>
      </div>
    </>
  );
}

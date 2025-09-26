// src/pages/reports.tsx
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";

type Card = { title: string; value: number };

type SummaryOk = {
  ok: true;
  kpis: {
    totalLeads90d: number;
    converted90d: number;
    rfp90d: number;
    monthBillableCount: number;
    monthBillableAmountUSD: number;
    hot90d: number;
    cold90d: number;
    periodStartISO: string;
    trend: Array<{ date: string; newLeads: number; converted: number }>;
  };
};

type SummaryErr = { ok: false; error: string };
type SummaryResp = SummaryOk | SummaryErr;

export default function ReportsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [range, setRange] = useState<"d7" | "d30" | "d90" | "all">("d30");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dashboard/summary");
        const j: SummaryResp = await r.json();
        if (!r.ok || !("ok" in j) || !j.ok) throw new Error(("error" in j && j.error) || "Failed to load");

        // Map KPIs to the simple cards UI
        const k = j.kpis;
        const nextCards: Card[] = [
          { title: "Leads (90d)", value: k.totalLeads90d ?? 0 },
          { title: "Converted (90d)", value: k.converted90d ?? 0 },
          { title: "RFP/SAM (90d)", value: k.rfp90d ?? 0 },
          { title: "Hot (90d)", value: k.hot90d ?? 0 },
        ];
        setCards(nextCards);
      } catch (e) {
        const msg = (e as { message?: string } | undefined)?.message ?? "Failed to load summary";
        setErr(msg);
      }
    })();
  }, []);

  const exportCsvHref = useMemo(() => {
    const p = new URLSearchParams();
    if (start || end) {
      if (start) p.set("start", start);
      if (end) p.set("end", end);
    } else {
      p.set("range", range);
    }
    return `/api/admin/export.csv?${p.toString()}`;
  }, [range, start, end]);

  const exportJsonHref = exportCsvHref.replace("export.csv", "export.json");

  return (
    <>
      <Head><title>Analytics Hub</title></Head>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Analytics Hub</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Performance insights and data export center
            </p>
          </div>
          <div className="flex gap-4">
            <button className="btn-secondary">
              <span>📊 Configure</span>
            </button>
            <button className="btn-primary">
              <span>💾 Export All</span>
            </button>
          </div>
        </div>

        {/* Premium KPI Cards */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Performance Metrics</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>90-day performance overview</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((c) => (
              <div key={c.title} className="kpi-card">
                <div className="kpi-card-content">
                  <div className="flex items-center justify-between mb-2">
                    <span className="kpi-label">{c.title}</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="kpi-value">{c.value.toLocaleString()}</div>
                  <div className="kpi-change">
                    <span className="text-emerald-400">↗ Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {err && (
            <div className="mt-6 p-4 rounded-xl" style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)' 
            }}>
              <div className="text-red-400 font-medium">Error Loading Data</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{err}</div>
            </div>
          )}
        </div>

        {/* Premium Export Section */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Data Export Center</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Export leads and analytics data in multiple formats
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Time Range
                </label>
                <select
                  className="input-field"
                  value={range}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setRange(e.target.value as "d7" | "d30" | "d90" | "all")
                  }
                >
                  <option value="d7">📅 Last 7 Days</option>
                  <option value="d30">📅 Last 30 Days</option>
                  <option value="d90">📅 Last 90 Days</option>
                  <option value="all">📅 All Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={start}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStart(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  End Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={end}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a 
                className="btn-secondary flex items-center gap-2" 
                href={exportCsvHref}
              >
                <span>📊 Download CSV</span>
              </a>
              <a 
                className="btn-secondary flex items-center gap-2" 
                href={exportJsonHref}
              >
                <span>📋 Download JSON</span>
              </a>
              <button className="btn-outline">
                <span>📈 Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
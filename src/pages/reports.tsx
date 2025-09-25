// src/pages/reports.tsx
import { useEffect, useMemo, useState } from "react";

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
        // You can surface more if you like; keep four for the current grid.
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
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Reports</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">{c.title}</div>
            <div className="mt-2 text-3xl font-semibold">{c.value}</div>
          </div>
        ))}
        {err && <div className="rounded-2xl border bg-red-50 p-4 text-red-700">{err}</div>}
      </div>

      {/* Export */}
      <div className="mt-8 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 text-sm font-medium">Export Leads</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Quick range</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={range}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setRange(e.target.value as "d7" | "d30" | "d90" | "all")
              }
            >
              <option value="d7">Last 7 days</option>
              <option value="d30">Last 30 days</option>
              <option value="d90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Start</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={start}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStart(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">End</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={end}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a className="rounded-md border px-3 py-2 hover:bg-muted" href={exportCsvHref}>
            Download CSV
          </a>
          <a className="rounded-md border px-3 py-2 hover:bg-muted" href={exportJsonHref}>
            Download JSON
          </a>
        </div>
      </div>
    </div>
  );
}

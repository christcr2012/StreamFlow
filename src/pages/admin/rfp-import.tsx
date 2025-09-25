// src/pages/admin/rfp-import.tsx
import Head from "next/head";
import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";

// Available NAICS codes for janitorial/cleaning. 561210 is optional.
const NAICS = [
  { code: "561720", label: "Janitorial Services" },
  { code: "561740", label: "Carpet & Upholstery" },
  { code: "561790", label: "Other Building Services" },
  { code: "561210", label: "Facilities Support (optional)" },
];

// PSC codes for housekeeping/facilities.
const PSC = [
  { code: "S201", label: "Housekeeping — Custodial/Janitorial" },
  { code: "S214", label: "Housekeeping — Carpet Cleaning" },
  { code: "S205", label: "Housekeeping — Trash/Garbage" },
  { code: "S299", label: "Housekeeping — Other" },
];

const DEFAULT_KWS =
  "janitorial custodial housekeeping cleaning window disinfecting sanitizing floor";

/**
 * Advanced RFP Import page allows admins to customize SAM.gov query parameters for
 * location (state), NAICS/PSC filters, optional posted date range, keywords and
 * result limit. The import runs via the /api/integrations/sam/fetch API.
 */
export default function RfpImportPage() {
  const { me, loading } = useMe();
  const [state, setState] = useState("CO");
  const [naics, setNaics] = useState<string[]>(["561720", "561740", "561790"]);
  const [pscCodes, setPscCodes] = useState<string[]>(["S201", "S214", "S299"]);
  const [keywords, setKeywords] = useState(DEFAULT_KWS);
  const [postedFrom, setFrom] = useState<string>("");
  const [postedTo, setTo] = useState<string>("");
  const [limit, setLimit] = useState(25);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "RFP Import • Admin";
  }, []);

  if (loading) return <p className="p-6">Loading…</p>;
  if (!me?.isOwner && !me?.isProvider) return <div className="p-6 text-red-600">Forbidden</div>;

  function toggle(list: string[], v: string, set: (a: string[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const body: {
        state: string;
        naics: string[];
        psc: string[];
        limit: number;
        keywords: string[];
        postedFrom?: string;
        postedTo?: string;
      } = { state, naics, psc: pscCodes, limit, keywords: keywords.split(/\s+/).filter(Boolean) };
      if (postedFrom || postedTo) {
        if (!postedFrom || !postedTo) throw new Error("Both Posted From and Posted To are required when using dates.");
        body.postedFrom = postedFrom;
        body.postedTo = postedTo;
      }
      const r = await fetch("/api/integrations/sam/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
      setMsg(`Imported ${j.imported} • Skipped ${j.skipped}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head><title>RFP Import</title></Head>
      <div className="mx-auto max-w-[900px] px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Advanced RFP Import (SAM.gov)</h1>
        <div className="rounded-2xl border p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium">State</span>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Limit (1-100)</span>
              <input
                type="number"
                min={1}
                max={100}
                className="mt-1 w-full border rounded px-3 py-2"
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(100, parseInt(e.target.value || "25", 10))))}
              />
            </label>
          </div>

          <div>
            <span className="text-sm font-medium">NAICS</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {NAICS.map((n) => (
                <button
                  key={n.code}
                  onClick={() => toggle(naics, n.code, setNaics)}
                  className={`px-3 py-1 rounded border ${naics.includes(n.code) ? "bg-black text-white" : ""}`}
                >
                  {n.code} — {n.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium">PSC</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {PSC.map((p) => (
                <button
                  key={p.code}
                  onClick={() => toggle(pscCodes, p.code, setPscCodes)}
                  className={`px-3 py-1 rounded border ${pscCodes.includes(p.code) ? "bg-black text-white" : ""}`}
                >
                  {p.code} — {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium">Posted From (YYYY-MM-DD)</span>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={postedFrom}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="2025-08-01"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Posted To (YYYY-MM-DD)</span>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={postedTo}
                onChange={(e) => setTo(e.target.value)}
                placeholder="2025-09-24"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Keywords (space-separated)</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={busy}
              className="rounded bg-black text-white px-4 py-2"
            >
              {busy ? "Importing…" : "Run Import"}
            </button>
            {msg && <span className="text-emerald-700">{msg}</span>}
            {err && <span className="text-red-600">{err}</span>}
          </div>
        </div>
      </div>
    </>
  );
}
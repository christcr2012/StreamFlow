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

const LEAD_SOURCES = [
  { 
    id: "sam", 
    name: "SAM.gov (Federal)", 
    description: "Free federal government contracts via SAM.gov",
    endpoint: "/api/integrations/sam/fetch"
  },
  { 
    id: "permits", 
    name: "Construction Permits (Northern CO)", 
    description: "Free hot leads from Northern Colorado construction projects",
    endpoint: "/api/integrations/permits/fetch"
  },
];

/**
 * Lead generation page for Northern Colorado cleaning business. 
 * Focuses on Sterling (headquarters), Greeley, Fort Collins, and surrounding areas.
 * All sources are completely FREE with geographic targeting.
 */
export default function RfpImportPage() {
  const { me, loading } = useMe();
  const [selectedSource, setSelectedSource] = useState("sam");
  const [state, setState] = useState("CO");
  const [naics, setNaics] = useState<string[]>(["561720", "561740", "561790"]);
  const [pscCodes, setPscCodes] = useState<string[]>(["S201", "S214", "S299"]);
  const [keywords, setKeywords] = useState(DEFAULT_KWS);
  const [postedFrom, setFrom] = useState<string>("");
  const [postedTo, setTo] = useState<string>("");
  const [limit, setLimit] = useState(25);
  const [permitSource, setPermitSource] = useState("weld");
  const [minValue, setMinValue] = useState(25000);
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
      const source = LEAD_SOURCES.find(s => s.id === selectedSource);
      if (!source) throw new Error("Invalid source selected");

      let body: Record<string, unknown> = { 
        state, 
        limit, 
        keywords: keywords.split(/\s+/).filter(Boolean) 
      };

      // SAM.gov specific parameters
      if (selectedSource === "sam") {
        body = { 
          ...body, 
          naics, 
          psc: pscCodes 
        };
        if (postedFrom || postedTo) {
          if (!postedFrom || !postedTo) throw new Error("Both Posted From and Posted To are required when using dates.");
          body.postedFrom = postedFrom;
          body.postedTo = postedTo;
        }
      }
      // Construction permits specific parameters
      else if (selectedSource === "permits") {
        body = {
          ...body,
          source: permitSource,
          minValue
        };
      }

      const r = await fetch(source.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
      
      const created = j.items?.filter((item: any) => item.created).length || 0;
      const skipped = j.items?.filter((item: any) => !item.created).length || 0;
      setMsg(`Imported ${created} leads • Skipped ${skipped} duplicates • All leads are FREE`);
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
        <h1 className="text-2xl font-semibold">Lead Generation - Northern Colorado</h1>
        
        <div className="rounded-2xl border p-5 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">100% Free Lead Sources</span>
          </div>
          <p className="text-sm text-green-700">All lead generation sources are completely free with no per-lead costs or subscriptions.</p>
        </div>

        {/* Source Selection */}
        {/* Source Selection */}
        <div className="rounded-2xl border p-5 space-y-4">
          <div>
            <span className="text-sm font-medium">Lead Source</span>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {LEAD_SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedSource === source.id 
                      ? "bg-black text-white border-black" 
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm opacity-75 mt-1">{source.description}</div>
                  <div className="text-xs text-green-600 mt-2 font-medium">FREE - No per-lead costs</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration */}
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

          {/* SAM.gov specific fields */}
          {selectedSource === "sam" && (
            <>
              <div>
                <span className="text-sm font-medium">NAICS Codes</span>
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
                <span className="text-sm font-medium">PSC Codes</span>
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
            </>
          )}

          {/* Construction permits specific fields */}
          {selectedSource === "permits" && (
            <>
              <div>
                <span className="text-sm font-medium">Northern Colorado Permit Source</span>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { id: "weld", label: "Weld County (Greeley/Evans)" },
                    { id: "fortcollins", label: "Fort Collins" },
                    { id: "denver", label: "Denver (High Value Only)" }
                  ].map((source) => (
                    <button
                      key={source.id}
                      onClick={() => setPermitSource(source.id)}
                      className={`px-3 py-2 rounded border text-sm ${
                        permitSource === source.id ? "bg-black text-white" : ""
                      }`}
                    >
                      {source.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Minimum Project Value ($)</span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={minValue}
                  onChange={(e) => setMinValue(parseInt(e.target.value || "25000", 10))}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Higher value projects are better hot leads for post-construction cleaning
                </div>
              </label>
            </>
          )}

          <label className="block">
            <span className="text-sm font-medium">Keywords (space-separated)</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={DEFAULT_KWS}
            />
          </label>

          {/* Source-specific help text */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            {selectedSource === "sam" && "SAM.gov searches federal contracts. Use NAICS/PSC codes for precise targeting of cleaning and janitorial opportunities."}
            {selectedSource === "permits" && "Northern Colorado construction permits provide HOT LEADS for post-construction cleaning. Sterling (headquarters) and Greeley get highest priority. Denver requires 3x higher project value ($75k+ default)."}
          </div>

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
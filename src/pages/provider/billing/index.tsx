// src/pages/provider/billing/index.tsx
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
import { useMe } from "@/lib/useMe";

type PreviewLine = {
  leadId: string;
  leadPublicId?: string | null;
  when?: string | null;
  unitPriceCents: number;
  amountCents: number;
};

type PreviewResponse = {
  ok: boolean;
  count: number;
  totalCents: number;
  window: { label: string; fromISO: string; toISO: string };
  lines: PreviewLine[];
  error?: string;
};

type CreateResponse = {
  ok: boolean;
  reused: boolean;
  invoice: {
    id: string;
    number: string;
    periodFrom: string;
    periodTo: string;
    status: string;
    totalCents: number;
  } | null;
  window: { label: string; fromISO: string; toISO: string };
  counts: { leads: number; lines: number };
  totals: { subtotalCents: number; taxCents: number; totalCents: number };
  error?: string;
};

type FedStatus = {
  ok: true;
  enabled: boolean;          // PROVIDER_FEDERATION_ENABLED==1
  mode: "sha256" | "h31";    // server verification mode
};

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function RangePicker({
  range, setRange, start, setStart, end, setEnd,
}: {
  range: string; setRange: (v: string) => void;
  start: string; setStart: (v: string) => void;
  end: string; setEnd: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
      <div>
        <label>Range</label>
        <select value={range} onChange={(e) => setRange(e.target.value)} style={{ display: "block", padding: 8 }}>
          <option value="d30">This Month (d30)</option>
          <option value="d7">Last 7 Days</option>
          <option value="d90">Last 90 Days</option>
          <option value="all">Last Year (365d)</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      {range === "custom" && (
        <>
          <div>
            <label>From (YYYY-MM-DD)</label>
            <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="2025-09-01" style={{ padding: 8 }} />
          </div>
          <div>
            <label>To (YYYY-MM-DD)</label>
            <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="2025-09-30" style={{ padding: 8 }} />
          </div>
        </>
      )}
    </div>
  );
}

export default function ProviderBilling() {
  const { me, loading: meLoading } = useMe();
  const router = useRouter();

  // Be tolerant to me shape: me.rbacRoles OR me.perms OR me.roles
  const rbac: string[] =
    (me?.rbacRoles as string[]) ||
    (me?.perms as string[]) ||
    (Array.isArray((me as any)?.roles) ? (me as any).roles : []) ||
    [];

  // Accept either "billing:manage" or "BILLING_MANAGE"
  const canManageBilling =
    rbac.includes("billing:manage") || rbac.includes("BILLING_MANAGE");

  // Live federation status from server
  const { data: fed } = useSWR<FedStatus>("/api/system/federation.status", fetcher, { refreshInterval: 30000 });

  const [range, setRange] = useState<string>("d30");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (range && range !== "custom") p.set("range", range);
    if (range === "custom") {
      if (start) p.set("start", start);
      if (end) p.set("end", end);
    }
    return p.toString();
  }, [range, start, end]);

  const { data: preview, error: previewErr, mutate } = useSWR<PreviewResponse>(
    canManageBilling ? `/api/billing/preview?${qs}` : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  const count = preview?.count ?? 0;
  const total = (preview?.totalCents ?? 0) / 100;
  const fromISO = preview?.window?.fromISO;
  const toISO = preview?.window?.toISO;

  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [openHowToSha, setOpenHowToSha] = useState(false);

  async function createDraft() {
    try {
      setCreating(true);
      setMsg(null);
      const url = `/api/billing/invoices.create?${qs || "range=d30"}`;
      const r = await fetch(url, { method: "POST" });
      const j: CreateResponse = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
      if (!j.invoice) {
        setMsg(`No eligible leads to bill for ${j.window.fromISO} → ${j.window.toISO}.`);
        await mutate();
        return;
      }
      setMsg(`${j.reused ? "Reused" : "Created"} draft ${j.invoice.number}: $${(j.totals.totalCents / 100).toFixed(2)} (${j.counts.leads} leads)`);
      await mutate();
      router.push(`/billing/invoices/${j.invoice.id}`);
    } catch (e: unknown) {
      const m = (e as { message?: string })?.message || "Failed to create invoice";
      setMsg(m);
    } finally {
      setCreating(false);
    }
  }

  if (meLoading) {
    return (
      <>
        <Head><title>Provider · Billing</title></Head>
        <div style={{ padding: 24 }}>Loading…</div>
      </>
    );
  }

  if (!canManageBilling) {
    return (
      <>
        <Head><title>Provider · Billing</title></Head>
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Provider Billing</h1>
          <div style={{ color: "#6b7280" }}>
            You don’t have permission to manage billing. (Requires <code>billing:manage</code> / <code>BILLING_MANAGE</code>.)
          </div>
        </div>
      </>
    );
  }

  const showShaCta = !!fed?.enabled && fed.mode === "h31";

  return (
    <>
      <Head><title>Provider · Billing</title></Head>
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Provider Billing</h1>
          <Link href="/billing/invoices" className="text-blue-600">View Invoices →</Link>
        </div>

        {/* Federation banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "1px dashed #d1d5db",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            background: "#fcfcff",
          }}
          title="Cross-instance Provider Federation status (server-side)"
        >
          <span style={{
            display: "inline-block",
            width: 10, height: 10, borderRadius: 999,
            background: fed?.enabled ? "#10b981" : "#9ca3af"
          }} />
          <div style={{ fontSize: 13 }}>
            <b>Federation</b>: {fed?.enabled ? "Enabled" : "Disabled"}
            <span style={{ marginLeft: 10, color: "#6b7280" }}>
              Mode: <code>{fed?.mode || "h31"}</code>
            </span>
            <span style={{ marginLeft: 10, color: "#6b7280" }}>
              <em>Note:</em> If server mode is <code>sha256</code>, set <code>PROVIDER_FEDERATION_SIG_SHA256=1</code> in the Provider Portal too.
            </span>
            {showShaCta && (
              <button
                onClick={() => setOpenHowToSha(v => !v)}
                style={{ marginLeft: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}
                title="How to switch to SHA-256 on both server and Provider Portal"
              >
                ⚙ Switch to SHA-256
              </button>
            )}
          </div>
        </div>

        {showShaCta && openHowToSha && (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginTop: -8, marginBottom: 12, background: "#ffffff" }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}><b>Upgrade to HMAC-SHA-256 (recommended)</b></div>
            <ol style={{ fontSize: 13, color: "#374151", marginLeft: 18 }}>
              <li><b>Server (this client instance):</b> set <code>PROVIDER_FEDERATION_SIG_SHA256=1</code> in environment; deploy.</li>
              <li><b>Provider Portal:</b> set <code>PROVIDER_FEDERATION_SIG_SHA256=1</code> in the portal’s environment so its client shim sends <code>sha256:</code> signatures.</li>
              <li><b>Verify:</b> the banner above should show <code>Mode: sha256</code>, and your smoke test (see docs) should succeed.</li>
            </ol>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
              Tip: rotate <code>PROVIDER_KEYS_JSON</code> periodically; see <code>docs/RUNBOOK_FEDERATION_ACTIVATION.md</code> for copy-paste commands.
            </div>
          </div>
        )}

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16, background: "#fff" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Preview billable conversions</div>
          <RangePicker range={range} setRange={setRange} start={start} setStart={setStart} end={end} setEnd={setEnd} />
          <div style={{ marginTop: 12, fontSize: 14 }}>
            {previewErr ? (
              <span style={{ color: "crimson" }}>Error loading preview.</span>
            ) : (
              <>
                <b>{count}</b> leads, <b>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                {fromISO && toISO && (
                  <span style={{ color: "#6b7280" }}> &nbsp;({fromISO} → {toISO})</span>
                )}
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={createDraft}
              disabled={creating || (preview && preview.count === 0)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #111827",
                background: creating || (preview && preview.count === 0) ? "#9ca3af" : "#111827",
                color: "#fff",
                cursor: creating || (preview && preview.count === 0) ? "not-allowed" : "pointer",
              }}
              title={preview && preview.count === 0 ? "No eligible leads for the selected window" : "Create invoice draft"}
            >
              {creating ? "Creating…" : "Create invoice draft"}
            </button>
            <Link
              href="/billing/invoices"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#111827",
                textDecoration: "none",
              }}
              title="Open invoice history"
            >
              Open Invoices
            </Link>
          </div>

          {msg && <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>{msg}</div>}
        </div>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Notes: Only converted, system-generated leads are billable. Referrals excluded. Draft creation is idempotent per period.
        </div>
      </div>
    </>
  );
}

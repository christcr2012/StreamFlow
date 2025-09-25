// src/pages/admin/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";

function useImport() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function run() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/integrations/sam/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: "CO",
          naics: ["561720", "561740", "561790"],
          psc: ["S201", "S214", "S299"],
          keywords: ["janitorial", "custodial", "housekeeping", "cleaning"],
          limit: 25,
        }),
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.error || `HTTP ${res.status}`);
      setMsg(`Imported ${j.imported} • Skipped ${j.skipped}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Import failed";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }
  return { busy, msg, err, run };
}

/**
 * AdminPage shows links to integrations and billing tools for admins. Only owners
 * or providers can access this page. Quick import runs a preset RFP fetch
 * against SAM.gov for Colorado cleaning codes.
 */
export default function AdminPage() {
  const { me, loading } = useMe();
  const { busy, msg, err, run } = useImport();

  useEffect(() => {
    document.title = "Admin • Mountain Vista";
  }, []);

  if (loading) return <p className="p-6">Loading…</p>;
  if (!me?.isOwner && !me?.isProvider) {
    return <div className="p-6 text-red-600">Forbidden</div>;
  }

  return (
    <>
      <Head><title>Admin</title></Head>
      <div className="mx-auto max-w-[1100px] px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Admin</h1>

        {/* Provider-only cards */}
        {me?.role === "PROVIDER" && (
          <>
            <div className="rounded-2xl border p-5">
              <h2 className="text-lg font-medium mb-2">Integrations • SAM.gov</h2>
              <p className="text-sm text-gray-600 mb-3">Quick import: Colorado RFPs for janitorial-related codes.</p>
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50"
                  disabled={busy}
                  onClick={run}
                >
                  {busy ? "Importing…" : "Fetch RFPs (CO quick)"}
                </button>
                <Link href="/admin/rfp-import" className="underline text-sm">
                  Advanced RFP Import
                </Link>
              </div>
              {msg && <p className="text-emerald-700 mt-2">{msg}</p>}
              {err && <p className="text-red-600 mt-2">{err}</p>}
            </div>

            <div className="rounded-2xl border p-5">
              <h2 className="text-lg font-medium mb-2">Billing</h2>
              <p className="text-sm text-gray-600 mb-3">Preview billable conversions and create monthly invoices.</p>
              <div className="flex items-center gap-3">
                <Link href="/admin/billing" className="rounded bg-black text-white px-4 py-2">
                  Open Billing
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border p-5">
              <h2 className="text-lg font-medium mb-2">Provider Settings</h2>
              <p className="text-sm text-gray-600 mb-3">
                Manage provider‑level secrets (e.g. SAM.gov and Stripe keys) used for system
                integrations.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/admin/provider-settings" className="rounded bg-black text-white px-4 py-2">
                  Open Provider Settings
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Owner-only cards */}
        {me?.role === "OWNER" && (
          <>
            <div className="rounded-2xl border p-5">
              <h2 className="text-lg font-medium mb-2">Organization Settings</h2>
              <p className="text-sm text-gray-600 mb-3">
                Customize your brand and configure organization‑specific API tokens.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/admin/org-settings" className="rounded bg-black text-white px-4 py-2">
                  Open Org Settings
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border p-5">
              <h2 className="text-lg font-medium mb-2">Employee Referrals</h2>
              <p className="text-sm text-gray-600 mb-3">
                Add a referral from one of your employees. Referrals are non-billable leads.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/admin/add-referral" className="rounded bg-black text-white px-4 py-2">
                  Add Referral
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
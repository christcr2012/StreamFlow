// src/pages/admin/provider-settings.tsx
import { useEffect, useState } from "react";
import Head from "next/head";
import { useMe } from "@/lib/useMe";

/**
 * ProviderSettingsPage allows provider users to view and update system‑wide secrets
 * such as SAM.gov API keys or Stripe secret keys. Only users with role PROVIDER
 * may access this page. Values are stored in the ProviderConfig table.
 */
export default function ProviderSettingsPage() {
  const { me, loading } = useMe();
  const [samApiKey, setSamApiKey] = useState<string>("");
  const [stripeSecretKey, setStripeSecretKey] = useState<string>("");
  const [otherConfig, setOtherConfig] = useState<string>("{}");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Load existing config on mount
  useEffect(() => {
    if (!loading && me?.role === "PROVIDER") {
      fetch("/api/admin/provider-config")
        .then((r) => r.json())
        .then((j) => {
          if (j.ok && j.config) {
            setSamApiKey(j.config.samApiKey || "");
            setStripeSecretKey(j.config.stripeSecretKey || "");
            setOtherConfig(JSON.stringify(j.config.otherConfig || {}, null, 2));
          }
        })
        .catch(() => {});
    }
  }, [loading, me]);

  async function save() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      let parsedOther: Record<string, unknown> = {};
      try {
        parsedOther = otherConfig ? JSON.parse(otherConfig) : {};
      } catch {
        throw new Error("otherConfig must be valid JSON");
      }
      const r = await fetch("/api/admin/provider-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samApiKey, stripeSecretKey, otherConfig: parsedOther }),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
      setMsg("Settings saved.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="p-6">Loading…</p>;
  // Check role: only provider can see this page
  if (me?.role !== "PROVIDER") return <div className="p-6 text-red-600">Forbidden</div>;

  return (
    <>
      <Head><title>Provider Settings</title></Head>
      <div className="mx-auto max-w-[800px] px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Provider Settings</h1>
        <p className="text-sm text-gray-600">
          These settings apply to the entire application and are used for system integrations
          controlled by the provider. Only provider users can view or modify them.
        </p>
        {msg && <div className="text-emerald-700">{msg}</div>}
        {err && <div className="text-red-600">{err}</div>}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">SAM.gov API Key</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="text"
              value={samApiKey}
              onChange={(e) => setSamApiKey(e.target.value)}
              placeholder="Enter SAM.gov API Key"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Stripe Secret Key</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="text"
              value={stripeSecretKey}
              onChange={(e) => setStripeSecretKey(e.target.value)}
              placeholder="sk_live_..."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Other Config (JSON)</span>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2 font-mono"
              rows={6}
              value={otherConfig}
              onChange={(e) => setOtherConfig(e.target.value)}
            />
          </label>
          <button
            onClick={save}
            disabled={busy}
            className="rounded bg-black text-white px-4 py-2"
          >
            {busy ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </>
  );
}
// src/pages/admin/org-settings.tsx
import { useEffect, useState } from "react";
import Head from "next/head";
import { useMe } from "@/lib/useMe";

/**
 * OrgSettingsPage allows owners to configure their organization's brand and settings.
 * Owners can set the display name, primary color, logo URL, and arbitrary JSON
 * settings. Only users with role OWNER may access this page.
 */
export default function OrgSettingsPage() {
  const { me, loading } = useMe();
  // Brand config fields
  const [brandName, setBrandName] = useState<string>("");
  const [brandColor, setBrandColor] = useState<string>("");
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>("");
  // Settings JSON string and specific SAM.gov API key field. samApiKey is stored inside
  // settingsJson but we surface it separately for convenience.
  const [settingsJson, setSettingsJson] = useState<string>("{}");
  const [samApiKey, setSamApiKey] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && me?.role === "OWNER") {
      fetch("/api/admin/org-config")
        .then((r) => r.json())
        .then((j) => {
          if (j.ok) {
            const bc = j.brandConfig || {};
            setBrandName(bc.name || "");
            setBrandColor(bc.color || "");
            setBrandLogoUrl(bc.logoUrl || "");
            // Extract samApiKey from settingsJson if present
            const settings = j.settingsJson || {};
            setSamApiKey(settings.samApiKey || "");
            setSettingsJson(JSON.stringify(settings, null, 2));
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
      let parsedSettings: Record<string, unknown> = {};
      try {
        parsedSettings = settingsJson ? JSON.parse(settingsJson) : {};
      } catch {
        throw new Error("Settings JSON must be valid JSON");
      }
      // Inject samApiKey into settingsJson so the API can pick it up.
      if (samApiKey) {
        parsedSettings.samApiKey = samApiKey;
      } else {
        // If empty, remove from settings
        delete parsedSettings.samApiKey;
      }
      const body = {
        brandConfig: {
          name: brandName || undefined,
          color: brandColor || undefined,
          logoUrl: brandLogoUrl || undefined,
        },
        settingsJson: parsedSettings,
      };
      const r = await fetch("/api/admin/org-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
  if (me?.role !== "OWNER") return <div className="p-6 text-red-600">Forbidden</div>;

  return (
    <>
      <Head><title>Organization Settings</title></Head>
      <div className="mx-auto max-w-[800px] px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Organization Settings</h1>
        <p className="text-sm text-gray-600">
          Customize your organization&apos;s branding and configure integration settings here.
        </p>
        {msg && <div className="text-emerald-700">{msg}</div>}
        {err && <div className="text-red-600">{err}</div>}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Brand Name</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your Company Name"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Brand Primary Color</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#123456"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Brand Logo URL</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="text"
              value={brandLogoUrl}
              onChange={(e) => setBrandLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">SAM.gov API Key (client)</span>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="text"
              value={samApiKey}
              onChange={(e) => setSamApiKey(e.target.value)}
              placeholder="Enter your SAM.gov API Key"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Settings (JSON)</span>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2 font-mono"
              rows={6}
              value={settingsJson}
              onChange={(e) => setSettingsJson(e.target.value)}
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
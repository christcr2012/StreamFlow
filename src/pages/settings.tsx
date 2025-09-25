// src/pages/settings.tsx
import { useEffect, useState } from "react";

type OrgShape = { id: string; name: string; featureFlags: Record<string, unknown> | null };
type Me =
  | { ok: true; user: { email: string; name: string | null }; org?: OrgShape } // org is optional at runtime
  | { ok: false; error: string };

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me");
        const j = (await r.json()) as Me;
        // if the server sent a non-200 but body has ok:false, surface it
        if (!r.ok && (!("ok" in j) || (j.ok !== false && j.ok !== true))) {
          setMe({ ok: false, error: `Request failed (${r.status})` });
          return;
        }
        setMe(j);
      } catch {
        setMe({ ok: false, error: "Failed to load" });
      }
    })();
  }, []);

  // Safely derive fields with optional chaining/defaults
  const orgName = me && "ok" in me && me.ok ? me.org?.name ?? "" : "";
  const email = me && "ok" in me && me.ok ? me.user.email : "";
  const featureFlags =
    me && "ok" in me && me.ok ? me.org?.featureFlags ?? {} : {};

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>

      {/* Error banner when /api/me failed */}
      {me && "ok" in me && !me.ok && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {me.error || "Failed to load your profile"}
        </div>
      )}

      {/* Organization */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-medium">Organization</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Brand your internal app for your team.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Organization Name</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              defaultValue={orgName}
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Primary Color</label>
            <input
              type="color"
              className="h-10 w-20 rounded-md border"
              defaultValue="#0ea5e9"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Logo</label>
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4">
          <button className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90">
            Save Branding
          </button>
        </div>
      </section>

      {/* Feature Flags (read-only preview for now) */}
      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-medium">Feature Flags</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Coming soon — toggle modules for different teams.
        </p>
        <pre className="overflow-auto rounded-lg border bg-muted p-3 text-xs">
          {JSON.stringify(featureFlags, null, 2)}
        </pre>
      </section>

      {/* Admin contact */}
      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-medium">Admin Contact</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Primary Admin Email</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              defaultValue={email}
              readOnly
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// src/pages/profile.tsx
import { useEffect, useState } from "react";

type Me =
  | { ok: true; user: { email: string; name: string | null } }
  | { ok: false; error: string };

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me");
        const j = (await r.json()) as Me;
        setMe(j);
      } catch {
        // Failed to fetch me: set an error state
        setMe({ ok: false, error: "Failed to load" });
      }
    })();
  }, []);

  const email = me && "ok" in me && me.ok ? me.user.email : "";
  const name = me && "ok" in me && me.ok ? me.user.name ?? "" : "";

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed to change password");
      setMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const errObj = err as { message?: string } | undefined;
      setMsg(errObj?.message || "Failed to change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Your Profile</h1>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input className="w-full rounded-md border px-3 py-2" value={email} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm">Name</label>
            <input className="w-full rounded-md border px-3 py-2" value={name} readOnly />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-medium">Change Password</h2>
        <form onSubmit={changePassword} className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Current Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2"
              value={currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">New Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <button
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {busy ? "Saving..." : "Save Password"}
            </button>
            {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}

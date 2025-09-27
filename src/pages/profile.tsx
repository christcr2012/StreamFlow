// src/pages/profile.tsx
import { useEffect, useState } from "react";
import Head from "next/head";

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
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed to change password");
      setMsg("Password updated successfully.");
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
    <>
      <Head><title>User Profile</title></Head>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">User Profile</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Manage your account information and security settings
            </p>
          </div>
          <div className="flex gap-4">
            <button className="btn-secondary">
              <span>📱 Two-Factor</span>
            </button>
            <button className="btn-primary">
              <span>⚙️ Preferences</span>
            </button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Account Information</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Your basic profile details and contact information
              </p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center" 
                 style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
              <span className="text-3xl">👤</span>
            </div>
            
            <div className="flex-1 grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <input 
                  className="input-field" 
                  value={email} 
                  readOnly 
                  placeholder="your@email.com"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Primary email for login and notifications
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Display Name
                </label>
                <input 
                  className="input-field" 
                  value={name} 
                  readOnly 
                  placeholder="Your Name"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  How your name appears to other users
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button className="btn-outline">
              <span>✏️ Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Security Settings</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Update your password and manage account security
              </p>
            </div>
          </div>

          <form onSubmit={changePassword} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <button
                  className={`btn-primary ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={busy}
                  type="submit"
                >
                  <span>{busy ? "🔄 Updating..." : "🔒 Update Password"}</span>
                </button>
                <button type="button" className="btn-outline">
                  <span>🔧 Advanced Security</span>
                </button>
              </div>

              {msg && (
                <div 
                  className="px-3 py-2 rounded-lg text-sm"
                  style={msg.includes('successfully') || msg.includes('updated') 
                    ? { background: 'rgba(34, 197, 94, 0.2)', color: 'rgb(34, 197, 94)' }
                    : { background: 'rgba(239, 68, 68, 0.2)', color: 'rgb(239, 68, 68)' }
                  }
                >
                  {msg}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Activity & Sessions */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Activity & Sessions</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Monitor your account activity and active sessions
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl" 
                 style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-success)' }}></div>
                <div>
                  <div className="font-medium">Current Session</div>
                  <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Chrome on Windows • Active now
                  </div>
                </div>
              </div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Current
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl" 
                 style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium">Previous Session</div>
                  <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Safari on macOS • 2 hours ago
                  </div>
                </div>
              </div>
              <button className="text-sm" style={{ color: 'var(--brand-primary)' }}>
                Revoke
              </button>
            </div>
          </div>

          <div className="mt-6">
            <button className="btn-outline">
              <span>🔍 View All Activity</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
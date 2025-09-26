// src/pages/settings.tsx
import { useEffect, useState } from "react";
import Head from "next/head";

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
    <>
      <Head><title>System Configuration</title></Head>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">System Configuration</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Customize your organization settings and preferences
            </p>
          </div>
          <div className="flex gap-4">
            <button className="btn-secondary">
              <span>🔄 Reset</span>
            </button>
            <button className="btn-primary">
              <span>💾 Save All</span>
            </button>
          </div>
        </div>

        {/* Error banner when /api/me failed */}
        {me && "ok" in me && !me.ok && (
          <div className="p-4 rounded-xl" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)' 
          }}>
            <div className="text-red-400 font-medium">Configuration Error</div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {me.error || "Failed to load your profile"}
            </div>
          </div>
        )}

        {/* Organization Settings */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Organization Branding</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Customize your brand identity and team settings
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Organization Name
              </label>
              <input
                className="input-field"
                defaultValue={orgName}
                readOnly
                placeholder="Your Organization"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Primary Brand Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  className="h-10 w-20 rounded-lg border-0"
                  style={{ 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border-primary)' 
                  }}
                  defaultValue="#4a6fb5"
                />
                <input
                  className="input-field flex-1"
                  defaultValue="#4a6fb5"
                  placeholder="#4a6fb5"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center" 
                     style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Upload PNG, JPG or SVG. Recommended size: 256x256px
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button className="btn-primary">
              <span>✨ Save Branding</span>
            </button>
            <button className="btn-outline">
              <span>👁️ Preview</span>
            </button>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Feature Controls</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Toggle advanced features and module access
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl" 
                 style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
              <div>
                <div className="font-medium">Advanced Analytics</div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Enable detailed reporting and data insights
                </div>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl" 
                 style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
              <div>
                <div className="font-medium">SAM.gov Integration</div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Automatic federal contract opportunity imports
                </div>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl" 
                 style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
              <div>
                <div className="font-medium">White Label Mode</div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Remove Mountain Vista branding completely
                </div>
              </div>
              <div className="w-12 h-6 rounded-full relative cursor-pointer" 
                   style={{ background: 'var(--surface-1)' }}>
                <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full shadow-md"></div>
              </div>
            </div>
          </div>

          <details className="mt-6">
            <summary className="text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              🔧 Advanced Configuration
            </summary>
            <pre className="mt-3 p-4 rounded-xl text-xs overflow-auto" 
                 style={{ 
                   background: 'var(--surface-1)', 
                   border: '1px solid var(--border-primary)',
                   color: 'var(--text-tertiary)'
                 }}>
              {JSON.stringify(featureFlags, null, 2)}
            </pre>
          </details>
        </div>

        {/* Admin Contact */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Admin Contact</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Primary administrator and billing contact
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Primary Admin Email
              </label>
              <input
                className="input-field"
                defaultValue={email}
                readOnly
                placeholder="admin@yourcompany.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Backup Contact
              </label>
              <input
                className="input-field"
                placeholder="backup@yourcompany.com"
              />
            </div>
          </div>

          <div className="mt-6">
            <button className="btn-primary">
              <span>📧 Update Contacts</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
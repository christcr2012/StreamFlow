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

        {/* Developer Environment */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Developer Environment</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Development and testing configuration
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-xl border" style={{ 
              background: 'var(--surface-1)', 
              borderColor: 'var(--border-accent)'
            }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Developer Responsibility
                </span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                These settings are managed during development and handed off to the client in production
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Database Connection
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      className="input-field pr-20"
                      placeholder="postgresql://..."
                      readOnly
                      value="••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded" style={{ 
                        background: 'var(--accent-info)', 
                        color: 'var(--surface-primary)' 
                      }}>
                        DB
                      </span>
                      <span className="text-xs px-2 py-1 rounded" style={{ 
                        background: 'var(--accent-success)', 
                        color: 'var(--surface-primary)' 
                      }}>
                        ✓
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Connected to PostgreSQL database (managed via .env file)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Environment Mode
                  </label>
                  <div className="relative">
                    <select className="input-field pr-10" disabled>
                      <option>Development</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs px-2 py-1 rounded" style={{ 
                        background: 'var(--accent-warning)', 
                        color: 'var(--surface-primary)' 
                      }}>
                        DEV
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Automatically detected from NODE_ENV variable
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ 
              background: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.2)' 
            }}>
              <div className="text-green-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-green-400">Development Configuration</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Your development environment is properly configured and connected.
                  Production deployment will use GitHub/Vercel/Neon as specified.
                </div>
              </div>
            </div>
          </div>
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
// src/pages/dev/index.tsx
import { useState, useEffect } from "react";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";

/**
 * Dev Home Page - Global Settings and Portal Testing
 * Only accessible to users with DEV role for testing and administration
 */
export default function DevHome() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("settings");

  // Redirect non-owner users safely in useEffect
  useEffect(() => {
    if (!loading && me?.role !== "OWNER") {
      router.replace("/dashboard");
    }
  }, [loading, me?.role, router]);

  // Show loading or prevent render for non-owner users
  if (loading || me?.role !== "OWNER") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-info)' }}></div>
      </div>
    );
  }

  const tabs = [
    { id: "settings", label: "Global Settings", icon: "⚙️" },
    { id: "portals", label: "Portal Testing", icon: "🚪" },
    { id: "environment", label: "Environment", icon: "🔧" },
  ];

  const portalLinks = [
    { name: "Admin Portal (Owner)", href: "/dashboard", description: "Full admin access with all features" },
    { name: "Admin Portal (Manager)", href: "/dashboard", description: "Manager-level admin access" },
    { name: "Employee Portal", href: "/worker/home", description: "Mobile-optimized employee portal" },
    { name: "Provider Portal", href: "/provider", description: "Provider federation and analytics" },
    { name: "Accountant Portal", href: "/accountant/reports", description: "Financial reports and exports" },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            🛠️ Developer Control Center
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Global settings, portal testing, and system administration
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-1)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#4a6fb5] to-[#2c4a7a] text-white shadow-glow"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="premium-card">
              <h3 className="text-xl font-semibold mb-4 text-gradient">🔑 API Keys & Tokens</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      OpenAI API Key
                    </label>
                    <input 
                      type="password" 
                      className="input-field"
                      placeholder="sk-..." 
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Stripe Secret Key
                    </label>
                    <input 
                      type="password" 
                      className="input-field"
                      placeholder="sk_..." 
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Session Secret
                    </label>
                    <input 
                      type="password" 
                      className="input-field"
                      placeholder="secret..." 
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Database URL
                    </label>
                    <input 
                      type="password" 
                      className="input-field"
                      placeholder="postgresql://..." 
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                </div>
                <button className="btn-primary">
                  Update Environment Variables
                </button>
              </div>
            </div>

            <div className="premium-card">
              <h3 className="text-xl font-semibold mb-4 text-gradient">🎛️ System Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Debug Mode</h4>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Enable verbose logging and debug features</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Maintenance Mode</h4>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Disable access for non-admin users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "portals" && (
          <div className="space-y-6">
            <div className="premium-card">
              <h3 className="text-xl font-semibold mb-4 text-gradient">🚪 Portal Testing</h3>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Test all portal types to verify functionality and find improvements
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portalLinks.map((portal, index) => (
                  <a
                    key={index}
                    href={portal.href}
                    className="block p-4 rounded-lg border transition-all hover:border-accent hover:shadow-glow group"
                    style={{ 
                      background: 'var(--surface-1)', 
                      borderColor: 'var(--border-primary)' 
                    }}
                  >
                    <h4 className="font-semibold mb-2 group-hover:text-gradient" style={{ color: 'var(--text-primary)' }}>
                      {portal.name}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {portal.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "environment" && (
          <div className="space-y-6">
            <div className="premium-card">
              <h3 className="text-xl font-semibold mb-4 text-gradient">🔧 Environment Status</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Node Environment</h4>
                    <span className="status-pill status-pill--success">Development</span>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Database Status</h4>
                    <span className="status-pill status-pill--success">Connected</span>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>OpenAI API</h4>
                    <span className="status-pill status-pill--success">Active</span>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Stripe Integration</h4>
                    <span className="status-pill status-pill--warning">Not Configured</span>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Session Management</h4>
                    <span className="status-pill status-pill--success">Active</span>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Background Jobs</h4>
                    <span className="status-pill status-pill--info">Monitoring</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-card">
              <h3 className="text-xl font-semibold mb-4 text-gradient">📊 System Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="kpi-card">
                  <div className="kpi-value">99.9%</div>
                  <div className="kpi-label">Uptime</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value">142ms</div>
                  <div className="kpi-label">Response Time</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value">1,247</div>
                  <div className="kpi-label">Total Users</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value">$3.2k</div>
                  <div className="kpi-label">Monthly Revenue</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
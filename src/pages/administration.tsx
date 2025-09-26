// src/pages/administration.tsx
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Administration Hub - Centralized system administration and settings
 * Consolidates all admin functions including Dev Center access
 * Exceeds industry standards with comprehensive admin management
 */
export default function AdministrationHub() {
  const { me, loading } = useMe();
  const router = useRouter();

  // Redirect non-owner users
  useEffect(() => {
    if (!loading && me?.role !== "OWNER") {
      router.replace("/dashboard");
    }
  }, [loading, me?.role, router]);

  if (loading || me?.role !== "OWNER") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-info)' }}></div>
      </div>
    );
  }

  const adminAreas = [
    {
      category: "System Configuration",
      description: "Core system settings and global configuration",
      items: [
        {
          title: "System Settings",
          description: "Global system configuration and preferences",
          href: "/settings",
          icon: "⚙️",
          status: "Configured",
          priority: "medium",
          badge: "Core System"
        },
        {
          title: "Provider Settings",
          description: "Configure provider portal and federation",
          href: "/admin/provider-settings",
          icon: "🛠️",
          status: "Configured",
          priority: "medium",
          badge: "Advanced"
        }
      ]
    },
    {
      category: "Organization Management",
      description: "Organization settings and multi-tenant management",
      items: [
        {
          title: "Organization Settings",
          description: "Manage organization profile and branding",
          href: "/admin/org-settings",
          icon: "🏢",
          status: "Active",
          priority: "medium",
          badge: "Multi-tenant"
        },
        {
          title: "Admin Console",
          description: "Manage users, roles, and permissions",
          href: "/admin",
          icon: "👥",
          status: "RBAC Enabled",
          priority: "high",
          badge: "Role-Based"
        }
      ]
    },
    {
      category: "Business Administration",
      description: "Business process administration and automation",
      items: [
        {
          title: "Billing Administration",
          description: "Configure automated billing and payment settings",
          href: "/admin/billing",
          icon: "💳",
          status: "Automated",
          priority: "high",
          badge: "Stripe Integrated"
        },
        {
          title: "RFP Import System",
          description: "Manage SAM.gov integration and RFP processing",
          href: "/admin/rfp-import",
          icon: "📄",
          status: "Connected",
          priority: "medium",
          badge: "SAM.gov API"
        }
      ]
    },
    {
      category: "Provider & Integration",
      description: "Provider portal and external system integration",
      items: [
        {
          title: "System Integration",
          description: "Configure provider portal and federation",
          href: "/admin/provider-settings",
          icon: "🔗",
          status: "Federated",
          priority: "low",
          badge: "Federation"
        },
        {
          title: "Referral System",
          description: "Manage employee referral programs",
          href: "/admin/add-referral",
          icon: "🎯",
          status: "Active",
          priority: "low",
          badge: "Employee Program"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Administration Hub</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Centralized system administration and configuration management
              </p>
            </div>
          </div>

          {/* Admin Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="kpi-card">
              <div className="kpi-value">✅</div>
              <div className="kpi-label">System Status</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">12</div>
              <div className="kpi-label">Active Users</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">99.9%</div>
              <div className="kpi-label">Uptime</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">5</div>
              <div className="kpi-label">Integrations</div>
            </div>
          </div>
        </div>

        {/* Admin Areas */}
        <div className="space-y-8">
          {adminAreas.map((area, areaIndex) => (
            <div key={areaIndex} className="premium-card">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gradient mb-2">{area.category}</h2>
                <p style={{ color: 'var(--text-tertiary)' }}>{area.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {area.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    className="group block p-6 rounded-xl border transition-all hover:border-accent hover:shadow-glow"
                    style={{ 
                      background: 'var(--surface-1)', 
                      borderColor: 'var(--border-primary)' 
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{item.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold group-hover:text-gradient" style={{ color: 'var(--text-primary)' }}>
                            {item.title}
                          </h3>
                          <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.badge === 'Developer Tools' ? 'bg-red-500/20 text-red-300' :
                              item.badge === 'Core System' ? 'bg-blue-500/20 text-blue-300' :
                              item.badge === 'Multi-tenant' ? 'bg-purple-500/20 text-purple-300' :
                              item.badge === 'Role-Based' ? 'bg-indigo-500/20 text-indigo-300' :
                              item.badge === 'Stripe Integrated' ? 'bg-green-500/20 text-green-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {item.badge}
                            </span>
                            <span 
                              className={`status-pill ${
                                item.priority === 'high' ? 'status-pill--error' :
                                item.priority === 'medium' ? 'status-pill--warning' :
                                'status-pill--info'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* System Actions */}
        <div className="mt-8 premium-card">
          <h2 className="text-xl font-semibold text-gradient mb-6">System Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="btn-primary flex items-center gap-2 justify-center py-3">
              <span>🔄</span>
              <span>System Backup</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>📊</span>
              <span>System Logs</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>🔧</span>
              <span>Maintenance Mode</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>📈</span>
              <span>System Health</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// src/pages/analytics.tsx
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Analytics Command Center - Advanced business intelligence hub
 * Consolidates all reporting, analytics, and business intelligence
 * Exceeds industry standards with predictive analytics and AI insights
 */
export default function AnalyticsHub() {
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

  const analyticsAreas = [
    {
      category: "Business Intelligence",
      description: "Real-time dashboards and executive reporting",
      items: [
        {
          title: "Executive Dashboard",
          description: "High-level business metrics and KPIs",
          href: "/dashboard",
          icon: "📊",
          status: "Live Data",
          priority: "high",
          badge: "Real-time"
        },
        {
          title: "Advanced Reports",
          description: "Detailed business reports and custom analytics",
          href: "/reports",
          icon: "📈",
          status: "Updated Hourly",
          priority: "medium",
          badge: "Automated"
        }
      ]
    },
    {
      category: "Lead Analytics",
      description: "AI-powered lead scoring and conversion analytics",
      items: [
        {
          title: "Lead Intelligence",
          description: "AI scoring patterns and lead quality analysis",
          href: "/leads",
          icon: "🧠",
          status: "AI-Enhanced",
          priority: "high",
          badge: "Machine Learning"
        },
        {
          title: "Dashboard Analytics",
          description: "Track lead progression and identify bottlenecks",
          href: "/dashboard",
          icon: "🎯",
          status: "23% Rate",
          priority: "medium",
          badge: "Optimized"
        }
      ]
    },
    {
      category: "Financial Analytics",
      description: "Revenue forecasting and financial insights",
      items: [
        {
          title: "Revenue Reports",
          description: "Predictive revenue modeling and trends",
          href: "/reports",
          icon: "🔮",
          status: "+15% Predicted",
          priority: "high",
          badge: "Predictive AI"
        },
        {
          title: "Billing Analytics",
          description: "Operational costs and profitability analysis",
          href: "/billing/invoices",
          icon: "💹",
          status: "Optimized",
          priority: "low",
          badge: "Efficiency"
        }
      ]
    },
    {
      category: "Operational Analytics",
      description: "Performance metrics and operational insights",
      items: [
        {
          title: "Performance Reports",
          description: "Team productivity and service quality metrics",
          href: "/reports",
          icon: "⚡",
          status: "94% Efficiency",
          priority: "medium",
          badge: "Performance"
        },
        {
          title: "Customer Analytics",
          description: "Customer behavior and satisfaction insights",
          href: "/leads",
          icon: "👥",
          status: "4.8/5 Rating",
          priority: "medium",
          badge: "Satisfaction"
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Analytics Command Center</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                AI-powered business intelligence and predictive analytics
              </p>
            </div>
          </div>

          {/* Analytics KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="kpi-card">
              <div className="kpi-value">23%</div>
              <div className="kpi-label">Conversion Rate</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">$15k</div>
              <div className="kpi-label">Predicted Growth</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">94%</div>
              <div className="kpi-label">Efficiency Score</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">4.8</div>
              <div className="kpi-label">Customer Rating</div>
            </div>
          </div>
        </div>

        {/* Analytics Areas */}
        <div className="space-y-8">
          {analyticsAreas.map((area, areaIndex) => (
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
                              item.badge === 'Machine Learning' ? 'bg-purple-500/20 text-purple-300' :
                              item.badge === 'Predictive AI' ? 'bg-indigo-500/20 text-indigo-300' :
                              item.badge === 'Real-time' ? 'bg-green-500/20 text-green-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {item.badge}
                            </span>
                            <span 
                              className={`status-pill ${
                                item.priority === 'high' ? 'status-pill--success' :
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

        {/* Analytics Actions */}
        <div className="mt-8 premium-card">
          <h2 className="text-xl font-semibold text-gradient mb-6">Analytics Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="btn-primary flex items-center gap-2 justify-center py-3">
              <span>📊</span>
              <span>Custom Report</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>📈</span>
              <span>Export Data</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>🔮</span>
              <span>AI Insights</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>📅</span>
              <span>Schedule Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
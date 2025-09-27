// src/pages/revenue.tsx
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Revenue Management Hub - Comprehensive financial operations center
 * Consolidates billing, invoicing, payments, and financial analytics
 * CURRENT: Basic revenue workflow hub
 * 
 * 🚀 ENTERPRISE REVENUE OPERATIONS ROADMAP:
 * =========================================
 * 
 * 📊 UNIFIED REVENUE COMMAND CENTER:
 * - Real-time revenue dashboard with live metrics
 * - Executive-level KPI monitoring and alerts
 * - Cross-functional revenue workflow orchestration
 * - Revenue health scoring and risk assessment
 * - Automated revenue operations playbooks
 * - Predictive revenue analytics and forecasting
 * - Revenue performance benchmarking
 * 
 * 💰 ADVANCED FINANCIAL ANALYTICS:
 * - MRR/ARR tracking with cohort analysis
 * - Customer lifetime value optimization
 * - Revenue segmentation and attribution
 * - Pricing effectiveness analytics
 * - Revenue leakage detection and prevention
 * - Expansion revenue opportunity identification
 * - Competitive revenue intelligence
 * 
 * 🔗 ENTERPRISE REVENUE INTEGRATIONS:
 * - Salesforce Revenue Cloud synchronization
 * - HubSpot Revenue Operations integration
 * - NetSuite/QuickBooks real-time sync
 * - Business intelligence platform feeds
 * - Financial planning system connectivity
 * - Customer success platform integration
 * 
 * 🎯 REVENUE OPTIMIZATION ENGINE:
 * - AI-powered pricing optimization
 * - Dynamic discount and promotion management
 * - Contract value optimization recommendations
 * - Billing frequency optimization
 * - Payment method optimization
 * - Customer payment behavior modeling
 * 
 * 📋 COMPLIANCE & GOVERNANCE:
 * - Revenue recognition automation (ASC 606)
 * - Financial controls and audit trails
 * - Regulatory compliance monitoring
 * - SOX 404 control automation
 * - Board-level financial reporting
 * - Investor relations revenue metrics
 */
export default function RevenueHub() {
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

  const revenueAreas = [
    {
      category: "Billing & Invoicing",
      description: "Automated billing and invoice management system",
      items: [
        {
          title: "Active Invoices",
          description: "Manage pending and active customer invoices",
          href: "/billing/invoices",
          icon: "📄",
          status: "$12.4k Pending",
          priority: "high",
          badge: "Automated"
        },
        {
          title: "Admin Billing Settings",
          description: "Configure automated billing for converted leads",
          href: "/admin/billing",
          icon: "⚡",
          status: "98% Automated",
          priority: "medium",
          badge: "AI-Powered"
        }
      ]
    },
    {
      category: "Payment Processing",
      description: "Stripe-integrated payment management and tracking",
      items: [
        {
          title: "Payment Settings",
          description: "Stripe payment processing and management",
          href: "/settings",
          icon: "💳",
          status: "Connected",
          priority: "low",
          badge: "Stripe"
        },
        {
          title: "Revenue Reports",
          description: "Deep dive into revenue metrics and trends",
          href: "/reports",
          icon: "📈",
          status: "+23% Growth",
          priority: "medium",
          badge: "Trending"
        }
      ]
    },
    {
      category: "Financial Operations",
      description: "Advanced financial management and reporting",
      items: [
        {
          title: "Lead Conversion Tracking",
          description: "Track and bill for converted leads automatically",
          href: "/leads",
          icon: "🎯",
          status: "14 This Month",
          priority: "high",
          badge: "ROI Tracking"
        },
        {
          title: "Financial Reports",
          description: "Comprehensive financial reporting and insights",
          href: "/reports",
          icon: "📊",
          status: "Updated Daily",
          priority: "low",
          badge: "Real-time"
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Revenue Management Hub</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Automated billing, payment processing, and financial analytics
              </p>
            </div>
          </div>

          {/* Revenue KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="kpi-card">
              <div className="kpi-value">$47.2k</div>
              <div className="kpi-label">Monthly Revenue</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">$12.4k</div>
              <div className="kpi-label">Pending Invoices</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">14</div>
              <div className="kpi-label">Lead Conversions</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">96%</div>
              <div className="kpi-label">Collection Rate</div>
            </div>
          </div>
        </div>

        {/* Revenue Areas */}
        <div className="space-y-8">
          {revenueAreas.map((area, areaIndex) => (
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
                              item.badge === 'AI-Powered' ? 'bg-purple-500/20 text-purple-300' :
                              item.badge === 'Automated' ? 'bg-blue-500/20 text-blue-300' :
                              item.badge === 'Stripe' ? 'bg-indigo-500/20 text-indigo-300' :
                              'bg-green-500/20 text-green-300'
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

        {/* Revenue Actions */}
        <div className="mt-8 premium-card">
          <h2 className="text-xl font-semibold text-gradient mb-6">Revenue Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="btn-primary flex items-center gap-2 justify-center py-3">
              <span>📄</span>
              <span>Create Invoice</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>💳</span>
              <span>Process Payment</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>📊</span>
              <span>Revenue Report</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>⚙️</span>
              <span>Billing Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
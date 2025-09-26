// src/pages/operations.tsx
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Business Operations Hub - Centralized operational management
 * Combines Jobs, Schedule, Customer Management, and Service Delivery
 * Industry-leading design pattern following progressive disclosure principles
 */
export default function BusinessOperations() {
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

  const operationalAreas = [
    {
      category: "Service Delivery",
      description: "Manage active jobs and service schedules",
      items: [
        {
          title: "Active Jobs",
          description: "Track and manage ongoing service projects",
          href: "/jobs",
          icon: "🔧",
          status: "12 Active",
          priority: "high"
        },
        {
          title: "Schedule Management", 
          description: "Coordinate team schedules and assignments",
          href: "/schedule",
          icon: "📅",
          status: "3 Today",
          priority: "medium"
        }
      ]
    },
    {
      category: "Customer Operations",
      description: "Customer relationship and service management",
      items: [
        {
          title: "Customer Management",
          description: "Manage customer accounts and relationships",
          href: "/leads",
          icon: "🏢",
          status: "47 Active",
          priority: "medium"
        },
        {
          title: "Service Reports",
          description: "Service delivery and performance reports",
          href: "/reports",
          icon: "📋",
          status: "Updated Daily",
          priority: "medium"
        }
      ]
    },
    {
      category: "Quality & Compliance",
      description: "Ensure service quality and regulatory compliance",
      items: [
        {
          title: "Quality Reports",
          description: "Monitor service quality and customer satisfaction",
          href: "/reports",
          icon: "⭐",
          status: "94% Rating",
          priority: "low"
        },
        {
          title: "Admin Settings",
          description: "System administration and configuration",
          href: "/admin",
          icon: "✅",
          status: "Configured",
          priority: "low"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header with Command Center styling */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl">💼</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Business Operations</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Centralized operational management and service delivery oversight
              </p>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="kpi-card">
              <div className="kpi-value">12</div>
              <div className="kpi-label">Active Jobs</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">47</div>
              <div className="kpi-label">Active Customers</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">94%</div>
              <div className="kpi-label">Quality Rating</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">$24.2k</div>
              <div className="kpi-label">Monthly Revenue</div>
            </div>
          </div>
        </div>

        {/* Operations Categories */}
        <div className="space-y-8">
          {operationalAreas.map((area, areaIndex) => (
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
                          <span 
                            className={`status-pill ${
                              item.priority === 'high' ? 'status-pill--error' :
                              item.priority === 'medium' ? 'status-pill--warning' :
                              'status-pill--success'
                            }`}
                          >
                            {item.status}
                          </span>
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

        {/* Quick Actions */}
        <div className="mt-8 premium-card">
          <h2 className="text-xl font-semibold text-gradient mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary flex items-center gap-2 justify-center py-3">
              <span>➕</span>
              <span>Create New Job</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>📋</span>
              <span>Schedule Review</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>📊</span>
              <span>Operations Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// src/pages/workforce.tsx
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Workforce Management Hub - Employee portal access and HR management
 * Provides oversight of employee operations and workforce analytics
 * Exceeds industry standards with integrated HR and performance management
 */
export default function WorkforceHub() {
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

  const workforceAreas = [
    {
      category: "Employee Portal Access",
      description: "Direct access to employee portal and workforce oversight",
      items: [
        {
          title: "Employee Portal",
          description: "Access the mobile-optimized employee portal",
          href: "/worker/home",
          icon: "📱",
          status: "6 Active Sessions",
          priority: "high",
          badge: "Live Portal"
        },
        {
          title: "Time & Attendance",
          description: "Monitor employee time clock and attendance",
          href: "/worker/clock",
          icon: "⏰",
          status: "3 Clocked In",
          priority: "medium",
          badge: "Real-time"
        }
      ]
    },
    {
      category: "HR Management",
      description: "Human resources and employee administration",
      items: [
        {
          title: "Employee Management",
          description: "Add, edit, and manage employee accounts",
          href: "/admin",
          icon: "👥",
          status: "12 Employees",
          priority: "medium",
          badge: "RBAC Enabled"
        },
        {
          title: "Payroll Overview",
          description: "Payroll processing and compensation management",
          href: "/worker/payroll",
          icon: "💰",
          status: "Next: Dec 15",
          priority: "high",
          badge: "Automated"
        }
      ]
    },
    {
      category: "Performance & Training",
      description: "Employee development and performance tracking",
      items: [
        {
          title: "Performance Analytics",
          description: "Track employee performance and productivity",
          href: "/reports",
          icon: "📊",
          status: "94% Avg Score",
          priority: "medium",
          badge: "Analytics"
        },
        {
          title: "Training Programs",
          description: "Manage training programs and certifications",
          href: "/worker/training",
          icon: "🎓",
          status: "3 Active Programs",
          priority: "low",
          badge: "Development"
        }
      ]
    },
    {
      category: "Workforce Analytics",
      description: "Advanced workforce insights and planning",
      items: [
        {
          title: "Workforce Reports",
          description: "Capacity planning and workforce optimization",
          href: "/reports",
          icon: "📈",
          status: "Optimized",
          priority: "medium",
          badge: "Strategic"
        },
        {
          title: "Employee Portal",
          description: "Monitor employee satisfaction and engagement",
          href: "/worker/home",
          icon: "😊",
          status: "4.6/5 Score",
          priority: "low",
          badge: "Engagement"
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <span className="text-white text-xl">👨‍💼</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Workforce Management</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Employee portal oversight and comprehensive HR management
              </p>
            </div>
          </div>

          {/* Workforce KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="kpi-card">
              <div className="kpi-value">12</div>
              <div className="kpi-label">Total Employees</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">3</div>
              <div className="kpi-label">Currently Working</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">94%</div>
              <div className="kpi-label">Performance Score</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">4.6</div>
              <div className="kpi-label">Satisfaction Rating</div>
            </div>
          </div>
        </div>

        {/* Workforce Areas */}
        <div className="space-y-8">
          {workforceAreas.map((area, areaIndex) => (
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
                              item.badge === 'Live Portal' ? 'bg-green-500/20 text-green-300' :
                              item.badge === 'Real-time' ? 'bg-blue-500/20 text-blue-300' :
                              item.badge === 'RBAC Enabled' ? 'bg-purple-500/20 text-purple-300' :
                              item.badge === 'Automated' ? 'bg-indigo-500/20 text-indigo-300' :
                              'bg-orange-500/20 text-orange-300'
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

        {/* Workforce Actions */}
        <div className="mt-8 premium-card">
          <h2 className="text-xl font-semibold text-gradient mb-6">Workforce Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="btn-primary flex items-center gap-2 justify-center py-3">
              <span>➕</span>
              <span>Add Employee</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>⏰</span>
              <span>Attendance Report</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>📊</span>
              <span>Performance Review</span>
            </button>
            <button className="btn-secondary flex items-center gap-2 justify-center py-3">
              <span>💰</span>
              <span>Process Payroll</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
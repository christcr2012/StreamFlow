// src/components/DashboardModules.tsx
/*
=== ENTERPRISE UI/UX ROADMAP: DASHBOARD COMPONENT SYSTEM ===

🏢 CURRENT vs ENTERPRISE STANDARDS COMPARISON:
Current: Permission-based dashboard modules | Enterprise Standard: Intelligent adaptive dashboard ecosystem
SCORE: 7/10 - Good foundation, needs enterprise intelligence and customization

🎯 ENTERPRISE DASHBOARD COMPONENT ROADMAP:

🔥 HIGH PRIORITY (Q1 2025):
1. INTELLIGENT DASHBOARD PERSONALIZATION
   - AI-powered widget recommendations based on user behavior
   - Drag-and-drop dashboard customization with save/restore
   - Role-based default layouts with smart suggestions
   - Dynamic widget sizing and responsive grid system
   - Competitor: Salesforce Lightning Dashboard, Microsoft Power BI

2. ADVANCED DATA VISUALIZATION COMPONENTS
   - Interactive charts with drill-down capabilities
   - Real-time data streaming with live updates
   - Predictive analytics and trend visualization
   - Collaborative annotations and insights sharing
   - Competitor: Tableau embedded, Looker Studio, Chart.js

3. CONTEXTUAL ACTION SYSTEM
   - Smart contextual menus based on data and permissions
   - Bulk operations with progress tracking
   - Keyboard shortcuts and power user features
   - Undo/redo system for dashboard actions
   - Competitor: Linear quick actions, Notion command palette

⚡ MEDIUM PRIORITY (Q2 2025):
4. ENTERPRISE COLLABORATION FEATURES
   - Team dashboard sharing and collaboration
   - Real-time commenting and discussion threads
   - Dashboard version control and change tracking
   - Enterprise governance and approval workflows
   - Competitor: Microsoft Teams integration, Slack Canvas

5. ADVANCED PERFORMANCE & ACCESSIBILITY
   - Virtualized rendering for large datasets
   - Progressive loading with skeleton states
   - Full WCAG 2.1 AA compliance with screen reader support
   - High contrast and reduced motion options
   - Competitor: GitHub accessibility, Adobe Spectrum

🛠️ TECHNICAL IMPLEMENTATION:
- React Virtualized for performance optimization
- React Beautiful DND for drag-and-drop functionality
- Web Workers for data processing and calculations
- WebSocket for real-time updates
- IndexedDB for offline dashboard storage
*/

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMe } from "@/lib/useMe";
import { hasPerm, PERMS } from "@/lib/rbacClient";

// Enhanced Quick Access Module with Permission-Based Actions
/*
 * ENTERPRISE ROADMAP: Quick Actions Enhancement
 * 
 * IMPROVEMENTS NEEDED:
 * - Add contextual actions based on current page/data
 * - Implement keyboard shortcuts and command palette
 * - Add AI-powered action suggestions
 * - Include bulk operations and batch processing
 * - Add action history and undo/redo functionality
 * - Implement collaborative action tracking
 */
function QuickActionsModule({ userRole, me }: { userRole: string | undefined; me: any }) {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Get permission-based quick actions
  const getQuickActions = () => {
    const actions = [];

    // Lead Management Actions
    if (hasPerm(me, PERMS.LEAD_READ)) {
      actions.push({ 
        href: "/leads", 
        label: "View Leads", 
        icon: "👥", 
        color: "bg-blue-500",
        permission: "read"
      });
    }
    if (hasPerm(me, PERMS.LEAD_CREATE)) {
      actions.push({ 
        href: "/leads?action=create", 
        label: "Create Lead", 
        icon: "➕", 
        color: "bg-blue-600",
        permission: "create",
        isAction: true
      });
    }

    // Job Management Actions
    if (hasPerm(me, PERMS.JOB_READ)) {
      actions.push({ 
        href: "/jobs", 
        label: "View Jobs", 
        icon: "📋", 
        color: "bg-green-500",
        permission: "read"
      });
    }
    if (hasPerm(me, PERMS.JOB_CREATE)) {
      actions.push({ 
        href: "/jobs?action=create", 
        label: "Create Job", 
        icon: "📝", 
        color: "bg-green-600",
        permission: "create",
        isAction: true
      });
    }

    // Financial Actions
    if (hasPerm(me, PERMS.INVOICE_CREATE)) {
      actions.push({ 
        href: "/billing/invoices?action=create", 
        label: "Create Invoice", 
        icon: "📄", 
        color: "bg-purple-500",
        permission: "create",
        isAction: true
      });
    }
    if (hasPerm(me, PERMS.BILLING_READ)) {
      actions.push({ 
        href: "/revenue", 
        label: "Revenue Dashboard", 
        icon: "💰", 
        color: "bg-yellow-500",
        permission: "read"
      });
    }

    // Employee Management Actions
    if (hasPerm(me, PERMS.EMPLOYEE_READ)) {
      actions.push({ 
        href: "/workforce", 
        label: "Team Overview", 
        icon: "👨‍💼", 
        color: "bg-indigo-500",
        permission: "read"
      });
    }
    if (hasPerm(me, PERMS.USER_CREATE)) {
      actions.push({ 
        href: "/admin/user-management?action=create", 
        label: "Add User", 
        icon: "👤", 
        color: "bg-indigo-600",
        permission: "create",
        isAction: true
      });
    }

    // Time & Schedule Actions
    if (hasPerm(me, PERMS.TIMECLOCK_READ) && userRole === 'STAFF') {
      actions.push({ 
        href: "/worker/clock", 
        label: "Clock In/Out", 
        icon: "⏰", 
        color: "bg-blue-500",
        permission: "update",
        isAction: true
      });
    }
    if (hasPerm(me, PERMS.SCHEDULE_READ)) {
      actions.push({ 
        href: "/schedule", 
        label: "View Schedule", 
        icon: "📅", 
        color: "bg-orange-500",
        permission: "read"
      });
    }

    // Reports & Analytics
    if (hasPerm(me, PERMS.ANALYTICS_READ)) {
      actions.push({ 
        href: "/analytics", 
        label: "Analytics", 
        icon: "📊", 
        color: "bg-purple-500",
        permission: "read"
      });
    }
    if (hasPerm(me, PERMS.REPORTS_CREATE)) {
      actions.push({ 
        href: "/reports?action=generate", 
        label: "Generate Report", 
        icon: "📈", 
        color: "bg-orange-600",
        permission: "create",
        isAction: true
      });
    }

    // Limit to 8 actions for clean display
    return actions.slice(0, 8);
  };

  const actions = getQuickActions();

  const handleActionClick = async (action: any, e: React.MouseEvent) => {
    if (!action.isAction) return;
    
    e.preventDefault();
    setActionInProgress(action.label);
    
    try {
      // Map dashboard actions to API calls
      let apiAction = null;
      let actionData = {};
      
      if (action.label === "Create Lead") {
        apiAction = "create_lead_stub";
        actionData = { companyName: "New Lead" };
      } else if (action.label === "Create Job") {
        apiAction = "create_job_stub";
        actionData = { title: "New Job" };
      } else if (action.label === "Clock In/Out") {
        apiAction = "clock_in_out";
      } else if (action.label === "Generate Report") {
        apiAction = "generate_report";
        actionData = { type: "summary" };
      }
      
      if (apiAction) {
        // Call the actual API endpoint
        const response = await fetch("/api/quick-actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: apiAction, data: actionData })
        });
        
        const result = await response.json();
        
        if (result.ok) {
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
          } else if (result.message) {
            // Show success message for actions that don't redirect
            alert(result.message);
          }
        } else {
          console.error('Action failed:', result.error);
          alert(`Action failed: ${result.error}`);
        }
      } else {
        // For non-action buttons, just navigate
        window.location.href = action.href;
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="responsive-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
        <h2 className="responsive-heading-3 text-gradient">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <div key={action.href} className="relative">
            <Link
              href={action.href}
              onClick={(e) => handleActionClick(action, e)}
              className={`group flex flex-col items-center p-6 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-300 ${
                actionInProgress === action.label ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg relative`}>
                {actionInProgress === action.label ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <span className="text-xl text-white">{action.icon}</span>
                )}
              </div>
              <span className="text-sm font-medium text-center group-hover:text-white transition-colors">
                {action.label}
              </span>
              {action.permission && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  action.permission === 'create' ? 'bg-green-400' :
                  action.permission === 'update' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`} title={`${action.permission} permission`} />
              )}
            </Link>
          </div>
        ))}
      </div>
      
      {actions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No actions available with your current permissions.</p>
          <p className="text-sm mt-2">Contact your administrator to request access.</p>
        </div>
      )}
    </div>
  );
}

// Recent Activity Module - Shows recent actions based on role
function RecentActivityModule({ userRole }: { userRole: string | undefined }) {
  const getRecentActivities = () => {
    switch (userRole) {
      case "OWNER":
        return [
          { action: "New lead converted", time: "2 hours ago", type: "success" },
          { action: "Monthly revenue report generated", time: "4 hours ago", type: "info" },
          { action: "Team performance review completed", time: "1 day ago", type: "neutral" },
          { action: "New client contract signed", time: "2 days ago", type: "success" },
        ];
      case "MANAGER":
        return [
          { action: "Assigned job to Sarah Wilson", time: "1 hour ago", type: "info" },
          { action: "Approved timesheet for Mike Johnson", time: "3 hours ago", type: "success" },
          { action: "Scheduled team meeting", time: "5 hours ago", type: "info" },
          { action: "Reviewed lead quality scores", time: "1 day ago", type: "neutral" },
        ];
      case "STAFF":
        return [
          { action: "Clocked in for morning shift", time: "3 hours ago", type: "success" },
          { action: "Completed training module", time: "1 day ago", type: "success" },
          { action: "Updated job status", time: "2 days ago", type: "info" },
          { action: "Submitted timesheet", time: "3 days ago", type: "neutral" },
        ];
      case "ACCOUNTANT":
        return [
          { action: "Processed 12 invoices", time: "1 hour ago", type: "success" },
          { action: "Generated financial report", time: "4 hours ago", type: "info" },
          { action: "Reconciled bank statements", time: "1 day ago", type: "success" },
          { action: "Updated expense categories", time: "2 days ago", type: "neutral" },
        ];
      default:
        return [
          { action: "System backup completed", time: "2 hours ago", type: "success" },
          { action: "Database optimization finished", time: "6 hours ago", type: "info" },
          { action: "Security scan completed", time: "1 day ago", type: "neutral" },
          { action: "Performance metrics updated", time: "2 days ago", type: "info" },
        ];
    }
  };

  const activities = getRecentActivities();

  return (
    <div className="responsive-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
        <h2 className="responsive-heading-3 text-gradient">Recent Activity</h2>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className={`w-2 h-2 mt-2 rounded-full ${
              activity.type === 'success' ? 'bg-green-400' :
              activity.type === 'info' ? 'bg-blue-400' :
              'bg-gray-400'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.action}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
        <Link href="/reports" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          View all activity →
        </Link>
      </div>
    </div>
  );
}

// Performance Metrics Module - Role-specific KPIs
function PerformanceMetricsModule({ userRole }: { userRole: string | undefined }) {
  const getMetrics = () => {
    switch (userRole) {
      case "OWNER":
        return [
          { label: "Monthly Revenue", value: "$24,580", change: "+12%", trend: "up" },
          { label: "Lead Conversion", value: "34%", change: "+5%", trend: "up" },
          { label: "Team Productivity", value: "87%", change: "+2%", trend: "up" },
          { label: "Client Satisfaction", value: "4.8/5", change: "+0.2", trend: "up" },
        ];
      case "MANAGER":
        return [
          { label: "Team Performance", value: "92%", change: "+3%", trend: "up" },
          { label: "Jobs Completed", value: "156", change: "+8", trend: "up" },
          { label: "Response Time", value: "2.4h", change: "-0.3h", trend: "up" },
          { label: "Quality Score", value: "4.7/5", change: "+0.1", trend: "up" },
        ];
      case "STAFF":
        return [
          { label: "Hours This Week", value: "38.5", change: "+2.5", trend: "up" },
          { label: "Jobs Completed", value: "12", change: "+3", trend: "up" },
          { label: "Quality Rating", value: "4.9/5", change: "0", trend: "neutral" },
          { label: "Training Progress", value: "75%", change: "+25%", trend: "up" },
        ];
      case "ACCOUNTANT":
        return [
          { label: "Invoices Processed", value: "89", change: "+12", trend: "up" },
          { label: "Payment Collection", value: "94%", change: "+2%", trend: "up" },
          { label: "Expense Accuracy", value: "99.2%", change: "+0.1%", trend: "up" },
          { label: "Report Timeliness", value: "96%", change: "+4%", trend: "up" },
        ];
      default:
        return [
          { label: "System Uptime", value: "99.9%", change: "0%", trend: "neutral" },
          { label: "Active Users", value: "247", change: "+12", trend: "up" },
          { label: "Data Processing", value: "1.2M", change: "+0.3M", trend: "up" },
          { label: "Performance Score", value: "8.7/10", change: "+0.2", trend: "up" },
        ];
    }
  };

  const metrics = getMetrics();

  return (
    <div className="responsive-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
        <h2 className="responsive-heading-3 text-gradient">Performance Metrics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              {metric.label}
            </div>
            <div className={`flex items-center gap-1 text-xs ${
              metric.trend === 'up' ? 'text-green-400' :
              metric.trend === 'down' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              <span>{metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}</span>
              <span>{metric.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Navigation Shortcuts Module with Permission Checks
function NavigationShortcutsModule({ userRole, me }: { userRole: string | undefined; me: any }) {
  const getNavShortcuts = () => {
    const shortcuts = [];

    // Core Business Functions
    if (hasPerm(me, PERMS.LEAD_READ)) {
      shortcuts.push({ 
        href: "/leads", 
        label: "Lead Management", 
        description: "Manage your lead pipeline",
        category: "core"
      });
    }

    if (hasPerm(me, PERMS.JOB_READ)) {
      shortcuts.push({ 
        href: "/jobs", 
        label: "Job Management", 
        description: "Track all active jobs",
        category: "core"
      });
    }

    if (hasPerm(me, PERMS.EMPLOYEE_READ)) {
      shortcuts.push({ 
        href: "/workforce", 
        label: "Workforce", 
        description: "Manage your team",
        category: "core"
      });
    }

    if (hasPerm(me, PERMS.SCHEDULE_READ)) {
      shortcuts.push({ 
        href: "/schedule", 
        label: "Scheduling", 
        description: "Manage schedules",
        category: "core"
      });
    }

    // Financial Management
    if (hasPerm(me, PERMS.BILLING_READ)) {
      shortcuts.push({ 
        href: "/billing/invoices", 
        label: "Invoices & Billing", 
        description: "Process payments",
        category: "financial"
      });
    }

    if (hasPerm(me, PERMS.REVENUE_READ)) {
      shortcuts.push({ 
        href: "/revenue", 
        label: "Revenue & Billing", 
        description: "Financial overview",
        category: "financial"
      });
    }

    if (hasPerm(me, PERMS.PAYROLL_READ)) {
      shortcuts.push({ 
        href: "/worker/payroll", 
        label: "Payroll Management", 
        description: "Manage payroll",
        category: "financial"
      });
    }

    // Analytics & Reporting
    if (hasPerm(me, PERMS.ANALYTICS_READ)) {
      shortcuts.push({ 
        href: "/analytics", 
        label: "Analytics", 
        description: "Business insights",
        category: "analytics"
      });
    }

    if (hasPerm(me, PERMS.REPORTS_READ)) {
      shortcuts.push({ 
        href: "/reports", 
        label: "Reports", 
        description: "Generate reports",
        category: "analytics"
      });
    }

    // Administration
    if (hasPerm(me, PERMS.USER_READ)) {
      shortcuts.push({ 
        href: "/admin/user-management", 
        label: "User Management", 
        description: "Manage users & permissions",
        category: "admin"
      });
    }

    if (hasPerm(me, PERMS.SYSTEM_SETTINGS)) {
      shortcuts.push({ 
        href: "/administration", 
        label: "Administration", 
        description: "System settings",
        category: "admin"
      });
    }

    // Employee-specific shortcuts
    if (userRole === 'STAFF') {
      if (hasPerm(me, PERMS.TIMECLOCK_READ)) {
        shortcuts.push({ 
          href: "/worker/clock", 
          label: "Time Clock", 
          description: "Clock in/out",
          category: "employee"
        });
      }

      if (hasPerm(me, PERMS.TRAINING_READ)) {
        shortcuts.push({ 
          href: "/worker/training", 
          label: "Training", 
          description: "Complete training modules",
          category: "employee"
        });
      }
    }

    // Limit to 6 shortcuts for clean display
    return shortcuts.slice(0, 6);
  };

  const shortcuts = getNavShortcuts();

  return (
    <div className="responsive-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
        <h2 className="responsive-heading-3 text-gradient">Quick Navigation</h2>
      </div>
      
      {shortcuts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="group p-4 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-200 relative"
            >
              <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                {shortcut.label}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {shortcut.description}
              </div>
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                shortcut.category === 'core' ? 'bg-blue-400' :
                shortcut.category === 'financial' ? 'bg-green-400' :
                shortcut.category === 'analytics' ? 'bg-purple-400' :
                shortcut.category === 'admin' ? 'bg-red-400' :
                'bg-orange-400'
              }`} title={`${shortcut.category} function`} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No navigation shortcuts available with your current permissions.</p>
          <p className="text-sm mt-2">Contact your administrator to request access.</p>
        </div>
      )}
    </div>
  );
}

// Main Dashboard Modules Component
export default function DashboardModules() {
  const { me } = useMe();
  const userRole = me?.role;

  return (
    <div className="space-y-6">
      {/* Enhanced Quick Actions with Permission Checks */}
      <QuickActionsModule userRole={userRole} me={me} />
      
      {/* Performance Metrics - Role-specific KPIs */}
      <PerformanceMetricsModule userRole={userRole} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivityModule userRole={userRole} />
        
        {/* Enhanced Navigation Shortcuts with Permissions */}
        <NavigationShortcutsModule userRole={userRole} me={me} />
      </div>
    </div>
  );
}
// src/components/DashboardModules.tsx
import Link from "next/link";
import { useMemo } from "react";
import { useMe } from "@/lib/useMe";

// Quick Access Module - Shows primary actions based on role
function QuickActionsModule({ userRole }: { userRole: string | undefined }) {
  const getQuickActions = () => {
    switch (userRole) {
      case "OWNER":
        return [
          { href: "/leads", label: "Manage Leads", icon: "➕", color: "bg-blue-500" },
          { href: "/jobs", label: "Manage Jobs", icon: "📋", color: "bg-green-500" },
          { href: "/analytics", label: "View Analytics", icon: "📊", color: "bg-purple-500" },
          { href: "/revenue", label: "Revenue Report", icon: "💰", color: "bg-yellow-500" },
        ];
      case "MANAGER":
        return [
          { href: "/leads", label: "Add Lead", icon: "👥", color: "bg-blue-500" },
          { href: "/schedule", label: "Schedule Job", icon: "📅", color: "bg-green-500" },
          { href: "/workforce", label: "Team Status", icon: "👨‍💼", color: "bg-purple-500" },
          { href: "/reports", label: "Reports", icon: "📈", color: "bg-orange-500" },
        ];
      case "STAFF":
        return [
          { href: "/worker/clock", label: "Clock In/Out", icon: "⏰", color: "bg-blue-500" },
          { href: "/worker/jobs", label: "My Jobs", icon: "📋", color: "bg-green-500" },
          { href: "/schedule", label: "View Schedule", icon: "📅", color: "bg-purple-500" },
          { href: "/worker/training", label: "Training", icon: "🎓", color: "bg-orange-500" },
        ];
      case "ACCOUNTANT":
        return [
          { href: "/billing/invoices", label: "Process Invoices", icon: "📄", color: "bg-blue-500" },
          { href: "/worker/payroll", label: "Payroll", icon: "💰", color: "bg-green-500" },
          { href: "/reports", label: "Financial Reports", icon: "📊", color: "bg-purple-500" },
          { href: "/revenue", label: "Track Revenue", icon: "🧾", color: "bg-red-500" },
        ];
      default:
        return [
          { href: "/leads", label: "Manage Leads", icon: "➕", color: "bg-blue-500" },
          { href: "/jobs", label: "Manage Jobs", icon: "📋", color: "bg-green-500" },
          { href: "/reports", label: "View Reports", icon: "📊", color: "bg-purple-500" },
          { href: "/settings", label: "Settings", icon: "⚙️", color: "bg-gray-500" },
        ];
    }
  };

  const actions = getQuickActions();

  return (
    <div className="responsive-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
        <h2 className="responsive-heading-3 text-gradient">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col items-center p-6 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-300"
          >
            <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
              <span className="text-xl text-white">{action.icon}</span>
            </div>
            <span className="text-sm font-medium text-center group-hover:text-white transition-colors">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
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

// Navigation Shortcuts Module - Shows quick access to all nav items
function NavigationShortcutsModule({ userRole }: { userRole: string | undefined }) {
  const getNavShortcuts = () => {
    switch (userRole) {
      case "OWNER":
        return [
          { href: "/leads", label: "Lead Management", description: "Manage your lead pipeline" },
          { href: "/jobs", label: "Job Management", description: "Track all active jobs" },
          { href: "/workforce", label: "Workforce", description: "Manage your team" },
          { href: "/revenue", label: "Revenue & Billing", description: "Financial overview" },
          { href: "/analytics", label: "Analytics", description: "Business insights" },
          { href: "/administration", label: "Administration", description: "System settings" },
        ];
      case "MANAGER":
        return [
          { href: "/leads", label: "Lead Management", description: "Manage incoming leads" },
          { href: "/jobs", label: "Job Management", description: "Assign and track jobs" },
          { href: "/schedule", label: "Scheduling", description: "Manage team schedules" },
          { href: "/workforce", label: "Team Management", description: "Team performance" },
          { href: "/reports", label: "Reports", description: "Generate reports" },
          { href: "/settings", label: "Settings", description: "Manage preferences" },
        ];
      case "STAFF":
        return [
          { href: "/worker/jobs", label: "My Jobs", description: "View assigned jobs" },
          { href: "/schedule", label: "Schedule", description: "Check your schedule" },
          { href: "/worker/training", label: "Training", description: "Complete training modules" },
          { href: "/worker/payroll", label: "Payroll", description: "View pay information" },
          { href: "/worker/profile", label: "Profile", description: "Update your profile" },
          { href: "/reports", label: "Reports", description: "View your reports" },
        ];
      case "ACCOUNTANT":
        return [
          { href: "/billing/invoices", label: "Invoices & Billing", description: "Process payments" },
          { href: "/worker/payroll", label: "Payroll Management", description: "Manage payroll" },
          { href: "/revenue", label: "Revenue Tracking", description: "Track revenue streams" },
          { href: "/reports", label: "Financial Reports", description: "Generate reports" },
          { href: "/analytics", label: "Financial Analytics", description: "Financial insights" },
          { href: "/settings", label: "Settings", description: "Configure settings" },
        ];
      default:
        return [
          { href: "/leads", label: "Leads", description: "Manage leads" },
          { href: "/jobs", label: "Jobs", description: "Manage jobs" },
          { href: "/reports", label: "Reports", description: "View reports" },
          { href: "/settings", label: "Settings", description: "System settings" },
        ];
    }
  };

  const shortcuts = getNavShortcuts();

  return (
    <div className="responsive-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
        <h2 className="responsive-heading-3 text-gradient">Quick Navigation</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="group p-4 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-200"
          >
            <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
              {shortcut.label}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {shortcut.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Main Dashboard Modules Component
export default function DashboardModules() {
  const { me } = useMe();
  const userRole = me?.role;

  return (
    <div className="space-y-6">
      {/* Quick Actions - Most important for immediate productivity */}
      <QuickActionsModule userRole={userRole} />
      
      {/* Performance Metrics - Role-specific KPIs */}
      <PerformanceMetricsModule userRole={userRole} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivityModule userRole={userRole} />
        
        {/* Navigation Shortcuts */}
        <NavigationShortcutsModule userRole={userRole} />
      </div>
    </div>
  );
}
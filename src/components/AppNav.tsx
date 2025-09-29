// src/components/AppNav.tsx
/*
=== ENTERPRISE UI/UX ROADMAP: NAVIGATION & USER EXPERIENCE ===

🏢 CURRENT vs ENTERPRISE STANDARDS COMPARISON:
Current: Desktop sidebar navigation with role-based access | Enterprise Standard: Adaptive navigation with advanced UX patterns
SCORE: 7/10 - Good foundation, needs mobile and enterprise UX enhancements

🎯 ENTERPRISE NAVIGATION ROADMAP:

🔥 HIGH PRIORITY (Q1 2025):
1. ADAPTIVE NAVIGATION SYSTEM
   - Responsive navigation: sidebar → bottom tabs → hamburger menu
   - Context-aware navigation based on user role and current task
   - Progressive disclosure with nested navigation and breadcrumbs
   - Persistent navigation state and user preferences
   - Competitor: Microsoft Office navigation, Salesforce Lightning navigation

2. ADVANCED USER EXPERIENCE PATTERNS
   - Command palette for power users (Cmd+K universal search)
   - Recently accessed items and intelligent shortcuts
   - Contextual help and onboarding tours
   - Smart notifications and task management integration
   - Competitor: Linear command palette, Notion quick switcher

💡 COMMAND PALETTE ARCHITECTURE SPECIFICATION:
```typescript
// Provider Pattern with React Context
interface CommandPaletteProvider {
  commands: CommandItem[];
  keybindings: KeyBinding[];
  search: (query: string) => CommandItem[];
  execute: (command: string) => Promise<void>;
}

// ARIA Implementation
<div role="combobox" 
     aria-expanded={isOpen}
     aria-haspopup="listbox"
     aria-label="Command palette">
  <input role="searchbox" 
         aria-autocomplete="list"
         aria-controls="command-list" />
  <ul role="listbox" id="command-list">
    <li role="option" aria-selected={isSelected}>
      {command.label}
    </li>
  </ul>
</div>

// Keybinding System
const keybindings = {
  'cmd+k': 'open-command-palette',
  'cmd+p': 'quick-file-search',
  'cmd+shift+p': 'command-search'
};
```

3. ACCESSIBILITY-FIRST NAVIGATION
   - ARIA landmarks and screen reader navigation
   - Keyboard navigation with skip links and focus management
   - High contrast and reduced motion support
   - Voice navigation and keyboard shortcuts
   - Competitor: GitHub accessibility, GOV.UK navigation patterns

💡 ACCESSIBILITY TESTING IMPLEMENTATION:
```json
// package.json CI pipeline
{
  "scripts": {
    "test:a11y": "axe-cli http://localhost:3000 --tags wcag2a,wcag2aa",
    "test:a11y-ci": "pa11y-ci --sitemap http://localhost:3000/sitemap.xml"
  },
  "devDependencies": {
    "@axe-core/cli": "^4.6.0",
    "pa11y-ci": "^3.0.1",
    "@axe-core/react": "^4.6.0"
  }
}

// Jest + @testing-library accessibility tests
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('navigation is accessible', async () => {
  const { container } = render(<AppNav />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

⚡ MEDIUM PRIORITY (Q2 2025):
4. ENTERPRISE COLLABORATION FEATURES
   - Presence indicators and real-time collaboration status
   - Shared workspace navigation and team member activity
   - Cross-application navigation for enterprise integrations
   - Unified notification center with action items
   - Competitor: Microsoft Teams navigation, Slack workspace switching

5. INTELLIGENT NAVIGATION SYSTEM
   - AI-powered navigation suggestions based on user behavior
   - Predictive navigation and smart defaults
   - Personalized dashboard and menu customization
   - Usage analytics and navigation optimization
   - Competitor: Salesforce Einstein recommendations, Adobe AI features

🛠️ TECHNICAL IMPLEMENTATION:
- Next.js Pages Router with file-based routing and dynamic imports
- Next.js Link component with prefetch optimization for faster navigation
- Navigation state management with React Context or Zustand
- Intersection Observer for active section highlighting
- Static asset caching via Service Workers (non-sensitive routes only)
- Route-level code splitting with next/dynamic for performance
*/

import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useMe } from "@/lib/useMe";
import { logoutAndRedirect } from "@/lib/auth";

// Simple utility to join class names
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Enhanced NavLink component for premium desktop sidebar
function NavLink({ href, label, mobile = false, onClick }: { 
  href: string; 
  label: string; 
  mobile?: boolean;
  onClick?: () => void;
}) {
  const { pathname } = useRouter();
  const isActive = useMemo(() => {
    // Treat a link as active if the current path starts with it
    // (so /leads/new still highlights /leads)
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }, [href, pathname]);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "flex items-center gap-3 px-4 py-4 rounded-lg font-medium transition-all duration-200 group",
        isActive
          ? "bg-gradient-to-r from-[#4a6fb5] to-[#2c4a7a] text-white shadow-lg shadow-blue-500/25"
          : "text-slate-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/5"
      )}
    >
      <div className={cx(
        "w-2 h-2 rounded-full transition-all duration-200",
        isActive 
          ? "bg-white shadow-sm" 
          : "bg-slate-500 group-hover:bg-slate-300"
      )} />
      <span className="text-sm font-medium">{label}</span>
      {isActive && (
        <div className="ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      )}
    </Link>
  );
}

/**
 * Premium Desktop-Style Sidebar Navigation for Robinson Solutions Business OS.
 * 
 * ENTERPRISE ROADMAP IMPROVEMENTS NEEDED:
 * - Convert to responsive navigation system (sidebar/bottom tabs/hamburger)
 * - Add command palette and keyboard shortcuts (Cmd+K)
 * - Implement progressive disclosure with nested menus
 * - Add breadcrumb navigation and contextual help
 * - Include presence indicators and collaboration features
 * - Add voice navigation and advanced accessibility
 * - Implement intelligent navigation suggestions
 * 
 * CURRENT: Desktop-focused sidebar with role-based access
 * TARGET: Enterprise-grade adaptive navigation system
 * COMPETITORS: Salesforce Lightning, Microsoft Office, Linear
 */
export default function AppNav() {
  // Pull current user for portal routing
  const { me } = useMe();
  const { pathname } = useRouter();
  const userSpace = me?.space; // Use new space field from GitHub issue #1
  const userRole = me?.role; // Use role field for role-specific logic

  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking a nav item
  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Define portal-specific navigation based on user space (GitHub issue #4)
  const getPortalNavigation = () => {
    // Only render navigation for current space - prevents cross-space access
    switch (userSpace) {
      case "provider":
        return {
          portalName: "Provider Portal",
          homeRoute: "/provider/dashboard",
          leftLinks: [
            { href: "/provider/dashboard", label: "Dashboard" },
            { href: "/provider/clients", label: "Client Management" },
            { href: "/provider/analytics", label: "Analytics" },
            { href: "/provider/billing", label: "Billing" },
            { href: "/provider/settings", label: "Settings" },
          ],
          rightLinks: [
            { href: "/provider/federation", label: "Federation" },
            { href: "/provider/audit", label: "Audit Logs" },
            { href: "/provider/support", label: "Support" },
          ]
        };

      case "developer":
        return {
          portalName: "Developer Portal",
          homeRoute: "/dev/system",
          leftLinks: [
            { href: "/dev/system", label: "System Status" },
            { href: "/dev/database", label: "Database" },
            { href: "/dev/logs", label: "Logs" },
            { href: "/dev/testing", label: "Testing" },
          ],
          rightLinks: [
            { href: "/dev/metrics", label: "Metrics" },
            { href: "/dev/deployment", label: "Deployment" },
          ]
        };

      case "accountant":
        return {
          portalName: "Accountant Portal",
          homeRoute: "/accountant",
          leftLinks: [
            { href: "/accountant", label: "Dashboard" },
            { href: "/accountant/reports", label: "Financial Reports" },
            { href: "/accountant/reconciliation", label: "Reconciliation" },
          ],
          rightLinks: [
            { href: "/accountant/audit", label: "Audit Trail" },
          ]
        };

      case "client":
      default:
        // Client space navigation based on user role
        switch (userRole) {
          case "STAFF":
            return {
              portalName: "Employee Portal",
              homeRoute: "/worker/home",
              leftLinks: [
                { href: "/worker/home", label: "Home" },
                { href: "/worker/clock", label: "Time Clock" },
                { href: "/worker/jobs", label: "My Jobs" },
                { href: "/schedule", label: "My Schedule" },
                { href: "/workforce", label: "Team" },
              ],
              rightLinks: [
                { href: "/worker/training", label: "Training" },
                { href: "/reports", label: "Reports" },
                { href: "/worker/payroll", label: "Payroll" },
                { href: "/worker/profile", label: "Profile" },
              ]
            };

          case "OWNER":
            // Premium Command Center for OWNER
            return {
              portalName: "Business Command Center",
              homeRoute: "/dashboard",
              // Core Business Functions (Primary Navigation)
              leftLinks: [
                { href: "/dashboard", label: "Command Center" },
                { href: "/leads", label: "Lead Management" },
                { href: "/jobs", label: "Job Management" },
                { href: "/workforce", label: "Workforce" },
                { href: "/projects", label: "Projects" },
                { href: "/revenue", label: "Revenue & Billing" },
                { href: "/clients", label: "Client Portal" },
              ],
              // Analytics, Reports & Administration (Secondary Navigation)
              rightLinks: [
                { href: "/analytics", label: "Analytics" },
                { href: "/reports", label: "Reports" },
                { href: "/documents", label: "Documents" },
                { href: "/ai-usage", label: "AI Usage" },
                { href: "/administration", label: "Administration" },
                { href: "/profile", label: "Profile" },
              ]
            };

          case "MANAGER":
          default:
            return {
              portalName: "Manager Portal",
              homeRoute: "/dashboard",
              // Core Management Functions
              leftLinks: [
                { href: "/dashboard", label: "Dashboard" },
                { href: "/leads", label: "Lead Management" },
                { href: "/jobs", label: "Job Management" },
                { href: "/schedule", label: "Scheduling" },
                { href: "/team", label: "Team Management" },
                { href: "/clients", label: "Client Relations" },
              ],
              // Reports & Administration
              rightLinks: [
                { href: "/analytics", label: "Analytics" },
                { href: "/billing/invoices", label: "Invoices" },
                { href: "/reports", label: "Reports" },
                { href: "/documents", label: "Documents" },
                { href: "/settings", label: "Settings" },
              ]
            };
        }
    }
  };

  const { portalName, homeRoute, leftLinks, rightLinks } = getPortalNavigation();

  return (
    <>
      {/* Premium Desktop-Style Sidebar Navigation */}
      <div className="flex">
        {/* Fixed Desktop Sidebar */}
        <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-72 xl:w-80 2xl:w-96 lg:flex-col">
          <div 
            className="flex flex-col flex-1 min-h-0 border-r"
            style={{ 
              background: 'var(--glass-bg)',
              borderColor: 'var(--border-primary)',
              backdropFilter: 'blur(20px)',
              boxShadow: '2px 0 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Premium Brand Header */}
            <div className="flex items-center px-6 py-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <Link href={homeRoute} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>R</span>
                </div>
                <div>
                  <div className="text-xl font-bold text-gradient">Robinson Solutions</div>
                  <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{portalName}</div>
                </div>
              </Link>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Core Business Functions */}
              <div className="px-6 py-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Core Functions
                  </h3>
                </div>
                <div className="space-y-2">
                  {leftLinks.map((l) => (
                    <NavLink 
                      key={l.href} 
                      href={l.href} 
                      label={l.label} 
                      mobile={true}
                    />
                  ))}
                </div>
              </div>

              {/* Elegant Divider */}
              <div className="px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300/20 to-transparent"></div>
              </div>

              {/* Analytics & Administration */}
              <div className="px-6 py-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Analytics & Admin
                  </h3>
                </div>
                <div className="space-y-2">
                  {rightLinks.map((l) => (
                    <NavLink 
                      key={l.href} 
                      href={l.href} 
                      label={l.label} 
                      mobile={true}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Premium User Area & Logout */}
            <div className="px-6 py-6 border-t" style={{ borderColor: 'var(--border-primary)', background: 'var(--glass-bg)' }}>
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {me?.name?.charAt(0) || me?.email?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {me?.name || me?.email || 'User'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {userRole?.toLowerCase()}
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={logoutAndRedirect}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-slate-300 hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Sign Out</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>End your session</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button - Only visible on smaller screens */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {/* Enhanced Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            
            {/* Premium Mobile Sidebar */}
            <div 
              className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto"
              style={{ 
                background: 'var(--glass-bg)',
                borderRight: '1px solid var(--border-primary)',
                backdropFilter: 'blur(20px)',
                boxShadow: '4px 0 30px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Premium Header */}
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <Link href={homeRoute} className="flex items-center gap-3" onClick={handleMobileNavClick}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>R</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gradient">Robinson Solutions</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{portalName}</div>
                  </div>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Navigation Content */}
              <div className="flex-1 flex flex-col">
                {/* Core Functions */}
                <div className="px-6 py-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Core Functions
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {leftLinks.map((l) => (
                      <NavLink 
                        key={l.href} 
                        href={l.href} 
                        label={l.label} 
                        mobile={true}
                        onClick={handleMobileNavClick}
                      />
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="px-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300/20 to-transparent"></div>
                </div>

                {/* Analytics & Admin */}
                <div className="px-6 py-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Analytics & Admin
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {rightLinks.map((l) => (
                      <NavLink 
                        key={l.href} 
                        href={l.href} 
                        label={l.label} 
                        mobile={true}
                        onClick={handleMobileNavClick}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Premium User Footer */}
              <div className="p-6 border-t" style={{ borderColor: 'var(--border-primary)', background: 'var(--glass-bg)' }}>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {me?.name?.charAt(0) || me?.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {me?.name || me?.email || 'User'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {userRole?.toLowerCase()}
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    logoutAndRedirect();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-slate-300 hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Sign Out</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>End your session</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
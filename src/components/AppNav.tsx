// src/components/AppNav.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useMe } from "@/lib/useMe";
import { logoutAndRedirect } from "@/lib/auth";

// Simple utility to join class names
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Create a small NavLink component that knows when it's active
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
        "rounded-lg font-medium transition-all duration-200",
        mobile
          ? "w-full px-4 py-3 text-left" // Touch-friendly mobile sizing
          : "px-3 py-2 text-sm", // Desktop sizing
        isActive
          ? "bg-gradient-to-r from-[#4a6fb5] to-[#2c4a7a] text-white shadow-glow"
          : "text-slate-300 hover:text-white hover:bg-white/10"
      )}
    >
      {label}
    </Link>
  );
}

/**
 * Multi-portal navigation bar for Robinson Solutions Business OS.
 * Supports Admin/Manager, Employee, Client, Accountant, and Provider portals.
 * - Role-based navigation with portal-specific routes
 * - Mobile-optimized for employee portal
 * - Premium styling with Robinson Solutions branding
 */
export default function AppNav() {
  // Pull current user for portal routing
  const { me } = useMe();
  const { pathname } = useRouter();
  const userRole = me?.role;
  
  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close mobile menu when clicking a nav item
  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Define portal-specific navigation based on user role
  const getPortalNavigation = () => {
    switch (userRole) {
      case "PROVIDER":
        return {
          portalName: "Provider Portal",
          homeRoute: "/provider",
          leftLinks: [
            { href: "/provider", label: "Dashboard" },
          ],
          rightLinks: [
            { href: "/provider/clients", label: "Clients" },
            { href: "/provider/analytics", label: "Analytics" },
            { href: "/provider/revenue", label: "Revenue" },
            { href: "/provider/settings", label: "Settings" },
          ]
        };
      
      case "STAFF":
        return {
          portalName: "Employee Portal",
          homeRoute: "/worker/home",
          leftLinks: [
            { href: "/worker/home", label: "Home" },
            { href: "/worker/clock", label: "Time Clock" },
            { href: "/worker/jobs", label: "My Jobs" },
          ],
          rightLinks: [
            { href: "/worker/training", label: "Training" },
            { href: "/worker/payroll", label: "Payroll" },
            { href: "/worker/profile", label: "Profile" },
          ]
        };
        
      case "ACCOUNTANT":
        return {
          portalName: "Accountant Portal",
          homeRoute: "/accountant/reports",
          leftLinks: [
            { href: "/accountant/reports", label: "Reports" },
            { href: "/accountant/exports", label: "Exports" },
          ],
          rightLinks: [
            { href: "/accountant/invoices", label: "Invoices" },
            { href: "/accountant/payroll", label: "Payroll" },
            { href: "/accountant/settings", label: "Settings" },
          ]
        };
        
      case "OWNER":
        // Check if this is a dev testing scenario - if accessing dev page or has dev intent
        if (pathname.startsWith('/dev')) {
          return {
            portalName: "Dev Center",
            homeRoute: "/dev",
            leftLinks: [
              { href: "/dev", label: "Dev Home" },
            ],
            rightLinks: [
              { href: "/dashboard", label: "→ Admin Portal" },
              { href: "/worker/home", label: "→ Employee Portal" },
              { href: "/provider", label: "→ Provider Portal" },
              { href: "/accountant/reports", label: "→ Accountant Portal" },
            ]
          };
        }
        // New Command Center design for OWNER - exceeds industry standards
        return {
          portalName: "Business Command Center",
          homeRoute: "/dashboard",
          leftLinks: [
            { href: "/dashboard", label: "🏠 Command Center" },
            { href: "/leads", label: "👥 Lead Generation" },
            { href: "/operations", label: "💼 Business Ops" },
            { href: "/revenue", label: "💰 Revenue Hub" },
            { href: "/analytics", label: "📊 Analytics" },
            { href: "/ai-usage", label: "🤖 AI Usage" },
            { href: "/workforce", label: "👨‍💼 Workforce" },
          ],
          rightLinks: [
            { href: "/search", label: "🔍" },
            { href: "/administration", label: "⚙️ Admin" },
            { href: "/profile", label: "👤" },
          ]
        };
        
      case "MANAGER":
      default:
        return {
          portalName: "Admin Portal",
          homeRoute: "/dashboard",
          leftLinks: [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/leads", label: "Leads" },
            { href: "/jobs", label: "Jobs" },
            { href: "/schedule", label: "Schedule" },
          ],
          rightLinks: [
            { href: "/billing/invoices", label: "Invoices" },
            { href: "/reports", label: "Reports" },
            { href: "/settings", label: "Settings" },
          ]
        };
    }
  };

  const { portalName, homeRoute, leftLinks, rightLinks } = getPortalNavigation();

  return (
    <>
      {/* Desktop Navigation */}
      <header className="w-full border-b backdrop-blur-xl" style={{ 
        background: 'var(--glass-bg)',
        borderColor: 'var(--border-primary)' 
      }}>
        <div className="mx-auto flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-4 max-w-none">
          {/* Mobile Menu Button - Touch-friendly */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
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

          {/* Premium Brand - Portal-specific home link */}
          <Link href={homeRoute} className="flex items-center gap-3 mr-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>R</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-gradient">Robinson Solutions</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{portalName}</div>
            </div>
            <div className="sm:hidden text-sm font-bold text-gradient">{portalName}</div>
          </Link>

          {/* Desktop Left Navigation - Hidden on mobile/tablet */}
          <nav className="hidden lg:flex items-center gap-2">
            {leftLinks.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} />
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop Right Navigation - Hidden on mobile/tablet */}
          <nav className="hidden lg:flex items-center gap-2">
            {rightLinks.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} />
            ))}
          </nav>

          {/* Premium Logout Button */}
          <button
            type="button"
            onClick={logoutAndRedirect}
            className="ml-4 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Sidebar */}
          <div 
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto"
            style={{ 
              background: 'var(--glass-bg)',
              borderRight: '1px solid var(--border-primary)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <Link href={homeRoute} className="flex items-center gap-3" onClick={handleMobileNavClick}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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

            {/* Sidebar Navigation */}
            <div className="p-4 space-y-2">
              {/* Main Navigation */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Main Menu
                </h3>
                <div className="space-y-1">
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

              {/* Secondary Navigation */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Quick Actions
                </h3>
                <div className="space-y-1">
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

            {/* Sidebar Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                type="button"
                onClick={() => {
                  logoutAndRedirect();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

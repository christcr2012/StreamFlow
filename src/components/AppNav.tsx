// src/components/AppNav.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useMe } from "@/lib/useMe";
import { logoutAndRedirect } from "@/lib/auth";

// Simple utility to join class names
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Create a small NavLink component that knows when it's active
function NavLink({ href, label }: { href: string; label: string }) {
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
      className={cx(
        "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
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
  const userRole = me?.role;

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
            ...(userRole === "OWNER" ? [{ href: "/admin", label: "Admin" }] : []),
          ],
          rightLinks: [
            { href: "/invoices", label: "Invoices" },
            { href: "/reports", label: "Reports" },
            { href: "/settings", label: "Settings" },
          ]
        };
    }
  };

  const { portalName, homeRoute, leftLinks, rightLinks } = getPortalNavigation();

  return (
    <header className="w-full border-b backdrop-blur-xl" style={{ 
      background: 'var(--glass-bg)',
      borderColor: 'var(--border-primary)' 
    }}>
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-4">
        {/* Premium Brand - Portal-specific home link */}
        <Link href={homeRoute} className="mr-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>R</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold text-gradient">Robinson Solutions</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{portalName}</div>
          </div>
          <div className="sm:hidden text-sm font-bold text-gradient">{portalName}</div>
        </Link>

        {/* Premium Left Navigation */}
        <nav className="flex items-center gap-2">
          {leftLinks.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Premium Right Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          {rightLinks.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        {/* Premium Logout Button */}
        <button
          type="button"
          onClick={logoutAndRedirect}
          className="ml-4 btn-secondary"
          title="Sign out"
        >
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

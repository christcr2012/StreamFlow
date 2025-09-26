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
          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-glow"
          : "text-slate-300 hover:text-white hover:bg-white/10"
      )}
    >
      {label}
    </Link>
  );
}

/**
 * App-wide top navigation bar.
 * - Highlights active route
 * - Provides quick links
 * - Includes Logout button (calls /api/auth/logout then redirects to /login)
 */
export default function AppNav() {
  // Pull current user flags for nav gating
  const { me } = useMe();

  // Build left-side links conditionally
  // Build left nav links based on the user's role. Owners and providers both see
  // the Admin link (which surfaces the appropriate settings for them). Only
  // providers see the Billing link. Staff/managers see just Dashboard and Leads.
  const leftLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/leads", label: "Leads" },
    ...(me?.role === "PROVIDER" || me?.role === "OWNER"
      ? [{ href: "/admin", label: "Admin" }]
      : []),
    ...(me?.role === "PROVIDER"
      ? [{ href: "/admin/billing", label: "Billing" }]
      : []),
  ];

  const rightLinks = [
    { href: "/reports", label: "Reports" },
    { href: "/settings", label: "Settings" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <header className="w-full border-b backdrop-blur-xl" style={{ 
      background: 'var(--glass-bg)',
      borderColor: 'var(--border-primary)' 
    }}>
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-4">
        {/* Premium Brand */}
        <Link href="/dashboard" className="mr-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">MV</span>
          </div>
          <span className="text-lg font-bold text-gradient">
            Mountain Vista
          </span>
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

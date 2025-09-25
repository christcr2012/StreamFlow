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
        "rounded px-3 py-2 text-sm transition",
        isActive
          ? "bg-black text-white"
          : "text-gray-700 hover:bg-gray-100"
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
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-3">
        {/* Brand / Logo */}
        <Link href="/dashboard" className="mr-2 flex items-center gap-2">
          {/* If you have public/logo.png, this keeps it subtle & tidy */}
          {/* <img src="/logo.png" alt="Logo" className="h-6 w-auto" /> */}
          <span className="text-base font-semibold tracking-tight">
            Mountain&nbsp;Vista
          </span>
        </Link>

        {/* Left nav */}
        <nav className="flex items-center gap-1">
          {leftLinks.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        {/* Spacer pushes right-side items to the end */}
        <div className="flex-1" />

        {/* Right nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {rightLinks.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        {/* Logout button */}
        <button
          type="button"
          onClick={logoutAndRedirect}
          className="ml-2 rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          title="Sign out"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

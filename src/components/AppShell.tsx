// src/components/AppShell.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useMe } from "@/lib/useMe";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";
import type { BrandConfig } from "@/lib/types/me";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const { org, loading } = useMe();
  const active = (p:string) => pathname === p || pathname.startsWith(p + "/");

  // Wrap everything in ThemeProvider for system-wide theme support
  return (
    <ThemeProvider orgId={org?.id}>
      <AppShellContent active={active} org={org} loading={loading}>
        {children}
      </AppShellContent>
    </ThemeProvider>
  );
}

function AppShellContent({
  children,
  active,
  org,
  loading
}: {
  children: React.ReactNode;
  active: (p: string) => boolean;
  org: any;
  loading: boolean;
}) {
  
  // Extract brand config safely with proper typing
  const brandConfig: BrandConfig = org?.brandConfig || {};
  const brandName = brandConfig.name || "WorkStream";
  const brandLogoUrl = brandConfig.logoUrl;
  const rawBrandColor = brandConfig.color;
  
  // Validate and normalize brand color to prevent CSS injection
  const validateColor = (color: string | undefined): string | null => {
    if (!color) return null;
    // Accept hex colors (3, 6, or 8 digits) and basic named colors
    const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    const namedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'gray', 'black', 'white'];
    
    if (hexPattern.test(color)) return color;
    if (namedColors.includes(color.toLowerCase())) return color;
    
    return null; // Invalid color, ignore it
  };
  
  const brandColor = validateColor(rawBrandColor);

  // Apply brand color to CSS variables if provided
  const dynamicStyles: React.CSSProperties & Record<string, string> = {};
  if (brandColor) {
    dynamicStyles['--brand'] = brandColor;
    dynamicStyles['--brand-2'] = brandColor;
    
    // Safely add transparency for ring color
    if (brandColor.startsWith('#')) {
      // For hex colors, convert to rgba for proper transparency
      let hex = brandColor.slice(1);
      
      // Handle 3-digit hex (expand to 6-digit)
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      
      // Handle 6-digit hex (standard case)
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        dynamicStyles['--ring'] = `rgba(${r}, ${g}, ${b}, 0.27)`;
      }
      // Handle 8-digit hex (with alpha)
      else if (hex.length === 8) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        dynamicStyles['--ring'] = `rgba(${r}, ${g}, ${b}, 0.27)`;
      }
    } else {
      // For named colors, use CSS color-mix (modern browsers) or fallback
      dynamicStyles['--ring'] = `color-mix(in srgb, ${brandColor} 27%, transparent)`;
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--theme-bg-main, linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%))' }}
    >
      {/* Dynamic Grid Background */}
      <div className="fixed inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'var(--theme-grid-pattern)',
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>

      <div
        className="relative grid"
        style={{
          gridTemplateColumns:"280px 1fr",
          gridTemplateRows:"auto 1fr",
          alignItems: "start",
          ...dynamicStyles
        }}>
        {/* Dynamic Themed Sidebar */}
        <aside
          style={{
            gridRow:"1 / span 2",
            backgroundColor: 'var(--theme-surface-1, rgba(20, 25, 35, 0.9))',
            borderRight: '1px solid var(--theme-border-primary, rgba(34, 197, 94, 0.2))'
          }}
          className="backdrop-blur-xl shadow-2xl"
        >
          {/* Futuristic Logo Section */}
          <div className="h-24 flex items-center justify-center border-b border-green-500/20 px-6">
            <Link href="/" aria-label="Home" className="block text-center">
              {/* Dynamic logo with futuristic styling */}
              {brandLogoUrl ? (
                <div className="relative">
                  <img
                    src={brandLogoUrl}
                    alt={`${brandName} Logo`}
                    style={{ height: "clamp(96px, 16vw, 180px)", width: "auto", maxWidth: "180px" }}
                    className="filter brightness-110 contrast-110"
                    onError={({ currentTarget }) => {
                      // Fallback to default logo on error and prevent infinite loops
                      currentTarget.onerror = null;
                      currentTarget.src = "/logo.png";
                    }}
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    priority
                    width={180}
                    height={180}
                    style={{ height: "clamp(96px, 16vw, 180px)", width: "auto" }}
                    className="filter brightness-110 contrast-110"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
              <div className="mt-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  {brandName}
                </h1>
                <p className="text-xs text-green-400 font-mono tracking-wider">
                  BUSINESS MANAGEMENT
                </p>
              </div>
            </Link>
          </div>

          {/* Futuristic Navigation */}
          <nav className="py-6 px-6 space-y-2">
            <NavLink href="/dashboard" active={active("/dashboard")}>
              <span className="text-lg mr-3">📊</span>Dashboard
            </NavLink>
            <NavLink href="/leads" active={active("/leads")}>
              <span className="text-lg mr-3">🎯</span>Leads
            </NavLink>
            <NavLink href="/intake" active={active("/intake")}>
              <span className="text-lg mr-3">📝</span>Intake
            </NavLink>
            <NavLink href="/admin" active={active("/admin")}>
              <span className="text-lg mr-3">⚙️</span>Admin
            </NavLink>
            <NavLink href="/dashboard/provider" active={active("/dashboard/provider")}>
              <span className="text-lg mr-3">🏢</span>Provider Portal
            </NavLink>
            <NavLink href="/reports" active={active("/reports")}>
              <span className="text-lg mr-3">📈</span>Reports
            </NavLink>
            <NavLink href="/settings" active={active("/settings")}>
              <span className="text-lg mr-3">🔧</span>Settings
            </NavLink>
            <NavLink href="/settings/themes" active={active("/settings/themes")}>
              <span className="text-lg mr-3">🎨</span>Themes
            </NavLink>
          </nav>
      </aside>

      {/* Dynamic Themed Top Bar */}
      <header
        className="backdrop-blur-xl shadow-2xl"
        style={{
          backgroundColor: 'var(--theme-surface-1, rgba(20, 25, 35, 0.9))',
          borderBottom: '1px solid var(--theme-border-primary, rgba(34, 197, 94, 0.2))'
        }}
      >
        <div className="h-20 px-8 flex items-center justify-between">
          {/* Dynamic Brand Display */}
          <div className="flex items-center space-x-4">
            <div
              className="w-1 h-8 rounded-full"
              style={{
                background: 'linear-gradient(to bottom, var(--theme-accent-primary, #22c55e), var(--theme-accent-secondary, #16a34a))'
              }}
            ></div>
            <div>
              <h2
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{
                  background: 'var(--theme-heading-gradient, linear-gradient(to right, #ffffff, #dcfce7))',
                  WebkitBackgroundClip: 'text'
                }}
              >
                {brandName}
              </h2>
              <p
                className="text-xs font-mono"
                style={{ color: 'var(--theme-text-accent, #22c55e)' }}
              >
                BUSINESS.CORE
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium border"
              style={{
                backgroundColor: 'var(--theme-surface-2, rgba(26, 31, 40, 0.95))',
                borderColor: 'var(--theme-border-accent, rgba(34, 197, 94, 0.3))',
                color: 'var(--theme-text-accent, #22c55e)'
              }}
            >
              Profile
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                className="px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium border border-red-500/30"
                style={{
                  backgroundColor: 'var(--theme-accent-error, #ef4444)20',
                  color: 'var(--theme-accent-error, #ef4444)'
                }}
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Dynamic Themed Content Area */}
      <main
        className="p-8 relative overflow-auto"
        style={{
          alignSelf: "start",
          justifySelf: "start",
          height: "fit-content",
          minHeight: 0,
          backgroundColor: 'var(--theme-surface-1, rgba(20, 25, 35, 0.9))50'
        }}
      >
        {/* Dynamic Content Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'var(--theme-background-pattern)'
            }}
          ></div>
        </div>

        <div className="max-w-6xl mx-auto w-full relative">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, active, children }:{href:string; active:boolean; children:React.ReactNode}) {
  return (
    <Link
      href={href}
      className="group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden border"
      style={{
        backgroundColor: active
          ? 'var(--theme-surface-2, rgba(26, 31, 40, 0.95))'
          : 'transparent',
        color: active
          ? 'var(--theme-text-accent, #22c55e)'
          : 'var(--theme-text-secondary, #cbd5e1)',
        borderColor: active
          ? 'var(--theme-border-accent, rgba(34, 197, 94, 0.3))'
          : 'transparent',
        boxShadow: active
          ? '0 4px 6px -1px var(--theme-shadow-accent, rgba(34, 197, 94, 0.1))'
          : 'none'
      }}
    >
      {/* Active indicator */}
      {active && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
          style={{
            background: 'linear-gradient(to bottom, var(--theme-accent-primary, #22c55e), var(--theme-accent-secondary, #16a34a))'
          }}
        ></div>
      )}

      <span className="flex items-center space-x-3 relative z-10">
        {children}
      </span>

      {/* Hover effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
        style={{
          background: 'linear-gradient(to right, transparent, var(--theme-accent-primary, #22c55e)05, transparent)'
        }}
      ></div>
    </Link>
  );
}

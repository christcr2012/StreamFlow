// src/components/AppShell.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useMe } from "@/lib/useMe";
import type { BrandConfig } from "@/lib/types/me";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const { org, loading } = useMe();
  const active = (p:string) => pathname === p || pathname.startsWith(p + "/");
  
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Futuristic Grid Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div
        className="relative grid"
        style={{
          gridTemplateColumns:"280px 1fr",
          gridTemplateRows:"auto 1fr",
          alignItems: "start",
          ...dynamicStyles
        }}>
        {/* Futuristic Sidebar */}
        <aside style={{gridRow:"1 / span 2"}} className="bg-slate-900/95 backdrop-blur-xl border-r border-green-500/20 shadow-2xl">
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
          </nav>
      </aside>

      {/* Futuristic Top Bar */}
      <header className="bg-slate-900/95 backdrop-blur-xl border-b border-green-500/20 shadow-2xl">
        <div className="h-20 px-8 flex items-center justify-between">
          {/* Futuristic Brand Display */}
          <div className="flex items-center space-x-4">
            <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                {brandName}
              </h2>
              <p className="text-xs text-green-400 font-mono">BUSINESS.CORE</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="px-4 py-2 bg-slate-800 border border-green-500/30 text-green-400 rounded-lg hover:bg-slate-700 transition-all duration-300 text-sm font-medium"
            >
              Profile
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-300 text-sm font-medium">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Futuristic Content Area */}
      <main className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 relative overflow-auto" style={{
        alignSelf: "start",
        justifySelf: "start",
        height: "fit-content",
        minHeight: 0
      }}>
        {/* Content Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
          }}></div>
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
      className={`
        group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden
        ${active
          ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-100 border border-green-500/30 shadow-lg shadow-green-500/10'
          : 'text-slate-300 hover:bg-slate-800/50 hover:text-green-100 hover:border-green-500/20 border border-transparent'
        }
      `}
    >
      {/* Active indicator */}
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600"></div>
      )}

      <span className="flex items-center space-x-3 relative z-10">
        {children}
      </span>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </Link>
  );
}

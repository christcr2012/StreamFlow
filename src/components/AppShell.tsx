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
  const brandName = brandConfig.name || "Mountain Vista";
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
      className="min-h-screen grid" 
      style={{
        gridTemplateColumns:"260px 1fr", 
        gridTemplateRows:"80px 1fr",
        ...dynamicStyles
      }}>
      {/* Sidebar */}
      <aside style={{gridRow:"1 / span 2"}} className="border-r border-white/10">
        {/* BIG logo row with brand name */}
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-4">
          <Link href="/" aria-label="Home" className="block text-center">
            {/* Dynamic logo with fallback */}
            {brandLogoUrl ? (
              // Use regular img tag for external URLs to avoid Next.js domain restrictions
              <img
                src={brandLogoUrl}
                alt={`${brandName} Logo`}
                style={{ height: "clamp(96px, 16vw, 180px)", width: "auto", maxWidth: "180px" }}
                onError={({ currentTarget }) => {
                  // Fallback to default logo on error and prevent infinite loops
                  currentTarget.onerror = null;
                  currentTarget.src = "/logo.png";
                }}
              />
            ) : (
              <Image
                src="/logo.png"
                alt="Logo"
                priority
                width={180}
                height={180}
                style={{ height: "clamp(96px, 16vw, 180px)", width: "auto" }}
              />
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="py-3 text-sm">
          <NavLink href="/dashboard" active={active("/dashboard")}>Dashboard</NavLink>
          <NavLink href="/leads"     active={active("/leads")}>Leads</NavLink>
          <NavLink href="/intake"    active={active("/intake")}>Intake</NavLink>
          <NavLink href="/admin"     active={active("/admin")}>Admin</NavLink>
          <NavLink href="/dashboard/provider" active={active("/dashboard/provider")}>Provider Portal</NavLink>
          <NavLink href="/reports"   active={active("/reports")}>Reports</NavLink>
          <NavLink href="/settings"  active={active("/settings")}>Settings</NavLink>
        </nav>
      </aside>

      {/* Top bar (glass, non-sticky) */}
      <header className="border-b border-white/10"
        style={{
          background: "linear-gradient(180deg, var(--bg-glass-a), var(--bg-glass-b))",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)"
        }}>
        <div className="h-20 px-6 flex items-center justify-between">
          {/* Brand name in header */}
          <div className="text-lg font-semibold text-gray-100">
            {brandName}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="text-sm text-gray-200 hover:text-white">Profile</Link>
            <form action="/api/auth/logout" method="post">
              <button className="text-sm app-btn" style={{padding:"8px 14px"}}>Sign out</button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto grid gap-16">
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
      className={`block px-4 py-2 ${active ? "text-white" : "text-gray-300 hover:text-white"}`}
    >
      {children}
    </Link>
  );
}

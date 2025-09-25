// src/components/AppShell.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const active = (p:string) => pathname === p || pathname.startsWith(p + "/");

  return (
    <div className="min-h-screen grid" style={{gridTemplateColumns:"260px 1fr", gridTemplateRows:"80px 1fr"}}>
      {/* Sidebar */}
      <aside style={{gridRow:"1 / span 2"}} className="border-r border-white/10">
        {/* BIG logo row */}
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-4">
          <Link href="/" aria-label="Home" className="block">
            {/* 5x larger (and responsive): clamp to avoid cartoonish size on small screens */}
            {/* Use next/image for optimized logo rendering */}
            <Image
              src="/logo.png"
              alt="Logo"
              priority
              width={180}
              height={180}
              style={{ height: "clamp(96px, 16vw, 180px)", width: "auto" }}
            />
          </Link>
        </div>

        {/* Nav */}
        <nav className="py-3 text-sm">
          <NavLink href="/dashboard" active={active("/dashboard")}>Dashboard</NavLink>
          <NavLink href="/leads"     active={active("/leads")}>Leads</NavLink>
          <NavLink href="/intake"    active={active("/intake")}>Intake</NavLink>
          <NavLink href="/admin"     active={active("/admin")}>Admin</NavLink>
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
        <div className="h-20 px-6 flex items-center justify-end gap-2">
          <Link href="/profile" className="text-sm text-gray-200 hover:text-white">Profile</Link>
          <form action="/api/auth/logout" method="post">
            <button className="text-sm app-btn" style={{padding:"8px 14px"}}>Sign out</button>
          </form>
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

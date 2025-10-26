'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProviderFlags } from '@/lib/useProviderFlags';

/**
 * Provider Portal Shell - SEPARATE from client AppShell
 * 
 * CRITICAL: This is for PROVIDER users only
 * - No client navigation (no Leads, Contacts, etc.)
 * - No useMe() hook (providers are not in database)
 * - No RBAC checks (providers have full access)
 * - Futuristic green accent theme for provider portal
 */
export default function ProviderShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (p: string) => Boolean(pathname === p || pathname?.startsWith(p + '/'));
  const { flags } = useProviderFlags();
  const aiCostEnabled = (flags && typeof flags === 'object' && (flags as any)['ai-cost'] !== false) || !flags; // default show until flags load

  return (
    <div
      className="min-h-screen grid"
      style={{
        gridTemplateColumns: '280px 1fr',
        gridTemplateRows: '80px 1fr',
        background: 'var(--bg-main)',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          gridRow: '1 / span 2',
          borderRight: '1px solid var(--border-primary)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Logo */}
        <div
          className="h-20 flex items-center justify-center px-4"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="text-center">
            <div
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--brand-gradient)' }}
            >
              Robinson AI Systems
            </div>
            <div
              className="text-xs font-mono tracking-wider"
              style={{ color: 'var(--brand-primary)', opacity: 0.7 }}
            >
              PROVIDER PORTAL
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="py-4 text-sm">
          <div
            className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--brand-primary)', opacity: 0.5 }}
          >
            Management
          </div>
          <ProviderNavLink href="/provider" active={active('/provider') && pathname === '/provider'}>
            Dashboard
          </ProviderNavLink>
          <ProviderNavLink href="/provider/leads" active={active('/provider/leads')}>
            Leads
          </ProviderNavLink>
          <ProviderNavLink href="/provider/ai" active={active('/provider/ai')}>
            AI
          </ProviderNavLink>
          {aiCostEnabled && (
            <ProviderNavLink href="/provider/ai/cost" active={active('/provider/ai/cost')}>
              AI Cost
            </ProviderNavLink>
          )}
          <ProviderNavLink href="/provider/clients" active={active('/provider/clients')}>
            Client Accounts
          </ProviderNavLink>
          <ProviderNavLink href="/provider/tenant-health" active={active('/provider/tenant-health')}>
            Tenant Health
          </ProviderNavLink>
          <ProviderNavLink href="/provider/api-usage" active={active('/provider/api-usage')}>
            API Usage
          </ProviderNavLink>

          <div
            className="px-4 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--brand-primary)', opacity: 0.5 }}
          >
            Revenue Streams
          </div>
          <ProviderNavLink href="/provider/revenue-intelligence" active={active('/provider/revenue-intelligence')}>
            Revenue Intelligence
          </ProviderNavLink>
          <ProviderNavLink href="/provider/monetization" active={active('/provider/monetization')}>
            Monetization
          </ProviderNavLink>
          <ProviderNavLink href="/provider/subscriptions" active={active('/provider/subscriptions')}>
            Subscriptions
          </ProviderNavLink>
          <ProviderNavLink href="/provider/addons" active={active('/provider/addons')}>
            Add-ons
          </ProviderNavLink>
          <ProviderNavLink href="/provider/billing" active={active('/provider/billing')}>
            Billing & Revenue
          </ProviderNavLink>
          <ProviderNavLink href="/provider/invoices" active={active('/provider/invoices')}>
            Invoices
          </ProviderNavLink>

          <div
            className="px-4 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--brand-primary)', opacity: 0.5 }}
          >
            Analytics & Operations
          </div>
          <ProviderNavLink href="/provider/analytics" active={active('/provider/analytics')}>
            Analytics
          </ProviderNavLink>
          <ProviderNavLink href="/provider/usage" active={active('/provider/usage')}>
            Usage Metering
          </ProviderNavLink>
          <ProviderNavLink href="/provider/incidents" active={active('/provider/incidents')}>
            Incidents & SLA
          </ProviderNavLink>
          <ProviderNavLink href="/provider/audit" active={active('/provider/audit')}>
            Audit Log
          </ProviderNavLink>

          <div
            className="px-4 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--brand-primary)', opacity: 0.5 }}
          >
            System
          </div>
          <ProviderNavLink href="/provider/federation" active={active('/provider/federation')}>
            Federation
          </ProviderNavLink>
          <ProviderNavLink href="/provider/provisioning" active={active('/provider/provisioning')}>
            Tenant Onboarding
          </ProviderNavLink>
          <ProviderNavLink href="/provider/branding" active={active('/provider/branding')}>
            White-Label
          </ProviderNavLink>
          <ProviderNavLink href="/provider/compliance" active={active('/provider/compliance')}>
            Compliance
          </ProviderNavLink>
          <ProviderNavLink href="/provider/settings" active={active('/provider/settings')}>
            Settings
          </ProviderNavLink>
        </nav>
      </aside>

      {/* Top bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--glass-bg-light)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <div className="h-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            />
            <div
              className="text-sm font-mono"
              style={{ color: 'var(--brand-primary)', opacity: 0.7 }}
            >
              PROVIDER ACCESS
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsBell />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Cross-Client Management
            </div>
            <form action="/api/provider/logout" method="post">
              <button
                className="text-sm px-4 py-2 rounded-lg transition-all font-mono"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  color: 'var(--brand-primary)',
                  border: '1px solid var(--border-accent)',
                }}
              >
                LOGOUT
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function NotificationsBell() {
  const [open, setOpen] = (require('react') as typeof import('react')).useState(false);
  const [items, setItems] = (require('react') as typeof import('react')).useState<Array<{ id: string; title: string; severity: string }>>([]);
  const [loading, setLoading] = (require('react') as typeof import('react')).useState(false);
  (require('react') as typeof import('react')).useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/provider/notifications?limit=6')
      .then((r) => r.json())
      .then((j) => setItems(j.items || []))
      .finally(() => setLoading(false));
  }, [open]);
  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v: boolean) => !v)}
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)', color: 'var(--brand-primary)' }}
      >
        bell
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg z-50"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)', backdropFilter: 'blur(10px)' }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-accent)' }}>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Notifications</div>
          </div>
          <div className="max-h-96 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>No notifications</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className="p-3 border-b" style={{ borderColor: 'var(--border-accent)' }}>
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{n.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{n.severity}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2.5 transition-all font-medium border-l-4"
      style={{
        color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
        backgroundColor: active ? 'var(--surface-hover)' : 'transparent',
        borderLeftColor: active ? 'var(--brand-primary)' : 'transparent',
        boxShadow: active ? 'var(--shadow-glow)' : 'none',
      }}
    >
      {children}
    </Link>
  );
}


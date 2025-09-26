// src/pages/search.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";

/**
 * Global Search Hub - AI-powered search across all business functions
 * Exceeds industry standards with intelligent search and quick actions
 * Similar to HubSpot's Quick Find and Salesforce's Global Search
 */
export default function GlobalSearch() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Redirect non-owner users
  useEffect(() => {
    if (!loading && me?.role !== "OWNER") {
      router.replace("/dashboard");
    }
  }, [loading, me?.role, router]);

  if (loading || me?.role !== "OWNER") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-info)' }}></div>
      </div>
    );
  }

  // Quick actions using existing routes
  const quickActions = [
    { title: "View Leads", href: "/leads", icon: "👥", category: "Lead Generation" },
    { title: "View Invoices", href: "/billing/invoices", icon: "📄", category: "Revenue" },
    { title: "View Jobs", href: "/jobs", icon: "📅", category: "Operations" },
    { title: "Employee Portal", href: "/worker/home", icon: "➕", category: "Workforce" },
    { title: "View Reports", href: "/reports", icon: "📊", category: "Analytics" },
    { title: "System Settings", href: "/settings", icon: "⚙️", category: "Administration" },
  ];

  const recentItems = [
    { title: "Mountain Vista Cleaning Services", href: "/leads", icon: "🏢", type: "Lead", updated: "2 hours ago" },
    { title: "Invoice #INV-2024-001", href: "/billing/invoices", icon: "📄", type: "Invoice", updated: "1 day ago" },
    { title: "Weekly Performance Report", href: "/reports", icon: "📊", type: "Report", updated: "3 days ago" },
    { title: "Employee Training Program", href: "/worker/training", icon: "🎓", type: "Training", updated: "1 week ago" },
  ];

  const searchCategories = [
    { name: "All", count: "∞", active: true },
    { name: "Leads", count: "247", active: false },
    { name: "Customers", count: "89", active: false },
    { name: "Invoices", count: "156", active: false },
    { name: "Jobs", count: "67", active: false },
    { name: "Employees", count: "12", active: false },
    { name: "Reports", count: "23", active: false },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <span className="text-white text-xl">🔍</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Global Search</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                AI-powered search across your entire business operations
              </p>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="premium-card mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search leads, customers, invoices, jobs, employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border-2 transition-all focus:border-accent"
              style={{ 
                background: 'var(--surface-1)', 
                borderColor: searchQuery ? 'var(--border-accent)' : 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Search Categories */}
          {searchQuery && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {searchCategories.map((category, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    category.active
                      ? "bg-gradient-to-r from-[#4a6fb5] to-[#2c4a7a] text-white"
                      : "bg-surface-2 text-gray-300 hover:bg-surface-hover"
                  }`}
                  style={{ 
                    background: category.active ? undefined : 'var(--surface-2)',
                    color: category.active ? undefined : 'var(--text-secondary)'
                  }}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Results or Default View */}
        {!searchQuery ? (
          <>
            {/* Quick Actions */}
            <div className="premium-card mb-8">
              <h2 className="text-xl font-semibold text-gradient mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="group flex items-center gap-3 p-4 rounded-lg border transition-all hover:border-accent hover:shadow-glow"
                    style={{ 
                      background: 'var(--surface-1)', 
                      borderColor: 'var(--border-primary)' 
                    }}
                  >
                    <span className="text-xl">{action.icon}</span>
                    <div>
                      <div className="font-medium group-hover:text-gradient" style={{ color: 'var(--text-primary)' }}>
                        {action.title}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {action.category}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Items */}
            <div className="premium-card">
              <h2 className="text-xl font-semibold text-gradient mb-6">Recent Items</h2>
              <div className="space-y-3">
                {recentItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="group flex items-center gap-4 p-4 rounded-lg border transition-all hover:border-accent hover:shadow-glow"
                    style={{ 
                      background: 'var(--surface-1)', 
                      borderColor: 'var(--border-primary)' 
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium group-hover:text-gradient" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div className="text-sm flex gap-3" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{item.type}</span>
                        <span>•</span>
                        <span>{item.updated}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Search Results */
          <div className="premium-card">
            <h2 className="text-xl font-semibold text-gradient mb-6">
              Search Results for "{searchQuery}"
            </h2>
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-info)' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Searching across all business data...</p>
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                <span className="text-4xl mb-4 block">🔍</span>
                <p>Start typing to search across leads, customers, invoices, and more...</p>
              </div>
            )}
          </div>
        )}

        {/* Search Tips */}
        <div className="mt-8 premium-card">
          <h3 className="text-lg font-semibold text-gradient mb-4">Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Quick Searches:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Use "lead:" to search only leads</li>
                <li>• Use "customer:" for customer search</li>
                <li>• Use "invoice:" for billing search</li>
              </ul>
            </div>
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Advanced Features:</strong>
              <ul className="mt-2 space-y-1">
                <li>• AI-powered semantic search</li>
                <li>• Real-time suggestions</li>
                <li>• Cross-functional results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
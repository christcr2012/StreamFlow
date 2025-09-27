// src/pages/clients.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";

export default function ClientsPage() {
  const { data: me } = useMe();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!me) {
      router.push("/login");
    }
  }, [me, router]);

  if (!me) {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gradient">Client Portal</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Manage your client relationships and accounts
            </p>
          </div>
          <button className="btn btn-primary">
            👥 Add Client
          </button>
        </div>

        {/* Search and Filters */}
        <div className="premium-card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <select className="px-4 py-2 rounded-lg border border-border-primary bg-surface">
              <option>All Clients</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>New</option>
            </select>
            <select className="px-4 py-2 rounded-lg border border-border-primary bg-surface">
              <option>All Services</option>
              <option>Cleaning</option>
              <option>HVAC</option>
              <option>Landscaping</option>
            </select>
          </div>
        </div>

        {/* Client Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "ABC Corporation",
              contact: "John Smith",
              email: "j.smith@abccorp.com",
              phone: "(555) 123-4567",
              status: "active",
              projects: 3,
              value: "$45,000",
              lastContact: "2 days ago",
            },
            {
              name: "RetailMax Inc",
              contact: "Sarah Johnson",
              email: "sarah@retailmax.com",
              phone: "(555) 987-6543",
              status: "active",
              projects: 1,
              value: "$18,500",
              lastContact: "1 week ago",
            },
            {
              name: "HealthFirst Medical",
              contact: "Dr. Michael Brown",
              email: "m.brown@healthfirst.com",
              phone: "(555) 456-7890",
              status: "active",
              projects: 2,
              value: "$32,000",
              lastContact: "3 days ago",
            },
          ].map((client, index) => (
            <div key={index} className="premium-card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {client.contact}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm bg-accent-success-bg text-accent-success">
                  {client.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💼</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {client.projects} active projects
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span className="font-semibold text-accent">{client.value}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-border-primary">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Last contact: {client.lastContact}
                </span>
                <button className="btn btn-secondary btn-sm">
                  View Client
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: "Total Clients", value: "24", icon: "👥" },
            { label: "Active Projects", value: "12", icon: "📋" },
            { label: "Monthly Revenue", value: "$85K", icon: "💰" },
            { label: "Client Satisfaction", value: "98%", icon: "⭐" },
          ].map((stat, index) => (
            <div key={index} className="premium-card text-center">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-accent">{stat.value}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
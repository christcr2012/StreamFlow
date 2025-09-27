// src/pages/documents.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";

export default function DocumentsPage() {
  const { data: me } = useMe();
  const router = useRouter();
  const [activeFolder, setActiveFolder] = useState("all");

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
            <h1 className="text-2xl font-bold text-gradient">Documents</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Manage contracts, proposals, and business documents
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              📤 Upload
            </button>
            <button className="btn btn-primary">
              📄 New Document
            </button>
          </div>
        </div>

        {/* Folder Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { key: "contracts", label: "Contracts", icon: "📋", count: 8 },
            { key: "proposals", label: "Proposals", icon: "💼", count: 5 },
            { key: "invoices", label: "Invoices", icon: "💰", count: 24 },
            { key: "rfps", label: "RFPs", icon: "📊", count: 12 },
            { key: "templates", label: "Templates", icon: "📝", count: 6 },
            { key: "legal", label: "Legal", icon: "⚖️", count: 3 },
          ].map((folder) => (
            <button
              key={folder.key}
              onClick={() => setActiveFolder(folder.key)}
              className={`premium-card p-4 text-center hover:shadow-lg transition-all ${
                activeFolder === folder.key ? "ring-2 ring-accent" : ""
              }`}
            >
              <div className="text-3xl mb-2">{folder.icon}</div>
              <div className="font-medium">{folder.label}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {folder.count} files
              </div>
            </button>
          ))}
        </div>

        {/* Recent Documents */}
        <div className="premium-card">
          <div className="p-6 border-b border-border-primary">
            <h2 className="text-xl font-semibold">Recent Documents</h2>
          </div>
          
          <div className="divide-y divide-border-primary">
            {[
              {
                name: "Service Agreement - ABC Corp",
                type: "Contract",
                size: "245 KB",
                modified: "2 hours ago",
                status: "signed",
              },
              {
                name: "Cleaning Proposal - RetailMax",
                type: "Proposal",
                size: "189 KB",
                modified: "1 day ago",
                status: "pending",
              },
              {
                name: "HVAC Maintenance Invoice #1024",
                type: "Invoice",
                size: "156 KB",
                modified: "3 days ago",
                status: "paid",
              },
              {
                name: "Government RFP - Federal Building",
                type: "RFP Response",
                size: "892 KB",
                modified: "5 days ago",
                status: "submitted",
              },
              {
                name: "Insurance Certificate",
                type: "Legal",
                size: "78 KB",
                modified: "1 week ago",
                status: "active",
              },
            ].map((doc, index) => (
              <div key={index} className="p-6 hover:bg-surface-hover transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
                      <span className="text-white text-sm">📄</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{doc.name}</h3>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {doc.type} • {doc.size} • Modified {doc.modified}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      doc.status === 'signed' ? 'bg-accent-success-bg text-accent-success' :
                      doc.status === 'paid' ? 'bg-accent-success-bg text-accent-success' :
                      doc.status === 'pending' ? 'bg-accent-warning-bg text-accent-warning' :
                      'bg-accent-info-bg text-accent-info'
                    }`}>
                      {doc.status}
                    </span>
                    <button className="btn btn-secondary btn-sm">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: "Total Documents", value: "58", icon: "📁" },
            { label: "Pending Signatures", value: "3", icon: "✍️" },
            { label: "Storage Used", value: "2.1 GB", icon: "💾" },
            { label: "Templates Available", value: "12", icon: "📝" },
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
// src/pages/projects.tsx
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";

export default function ProjectsPage() {
  const { me } = useMe();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("active");

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
            <h1 className="text-2xl font-bold text-gradient">Projects</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Manage your service projects and contracts
            </p>
          </div>
          <button className="btn btn-primary">
            ✨ New Project
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-1 premium-card p-1">
          {[
            { key: "active", label: "Active Projects", count: 3 },
            { key: "pending", label: "Pending", count: 1 },
            { key: "completed", label: "Completed", count: 12 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-accent text-white shadow-sm"
                  : "hover:bg-surface-hover"
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-surface-2">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sample Project Cards */}
          {[
            {
              name: "Downtown Office Building",
              client: "ABC Corp",
              status: "active",
              progress: 75,
              value: "$15,000",
            },
            {
              name: "Retail Chain Cleaning",
              client: "RetailMax",
              status: "active", 
              progress: 45,
              value: "$8,500",
            },
            {
              name: "Medical Center HVAC",
              client: "HealthFirst",
              status: "active",
              progress: 90,
              value: "$22,000",
            },
          ].map((project, index) => (
            <div key={index} className="premium-card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {project.client}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm bg-accent-success-bg text-accent-success">
                  {project.status}
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-surface-2 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-accent to-accent-secondary h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-accent">
                  {project.value}
                </span>
                <button className="btn btn-secondary btn-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="text-center py-12 premium-card">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
            <span className="text-2xl text-white">📋</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready to start your first project?</h3>
          <p style={{ color: 'var(--text-secondary)' }} className="mb-4">
            Create projects from converted leads or add them manually.
          </p>
          <button className="btn btn-primary">
            ✨ Create Project
          </button>
        </div>
      </div>
    </AppShell>
  );
}
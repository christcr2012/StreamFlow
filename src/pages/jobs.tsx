// src/pages/jobs.tsx
import Head from "next/head";

/**
 * Jobs Management Page
 * Placeholder page for job scheduling and management
 */
export default function Jobs() {
  return (
    <>
      <Head>
        <title>Jobs - Robinson Solutions</title>
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gradient">Jobs Management</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Manage customer jobs, work orders, and project scheduling
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="premium-card text-center">
          <div className="text-6xl mb-6" style={{ color: 'var(--accent-info)' }}>🔧</div>
          <h2 className="text-2xl font-semibold text-gradient mb-4">Jobs & Work Orders</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            This powerful feature is coming soon! You'll be able to manage customer jobs, 
            work orders, and track project progress from start to finish.
          </p>
          
          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: 'var(--accent-success)' }}>📅</div>
              <div className="kpi-label">Job Scheduling</div>
              <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Schedule and assign jobs to teams
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: 'var(--accent-warning)' }}>📋</div>
              <div className="kpi-label">Work Orders</div>
              <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Track task completion and progress
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>💬</div>
              <div className="kpi-label">Client Communication</div>
              <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Keep customers updated automatically
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: 'var(--accent-info)' }}>📊</div>
              <div className="kpi-label">Progress Tracking</div>
              <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Monitor job status and timelines
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
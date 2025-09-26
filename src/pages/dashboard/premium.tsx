// Premium Dashboard - Million Dollar Software Experience
// Integrated AI features with premium UX and cost controls

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useMe } from "@/lib/useMe";
import AppShell from "@/components/AppShell";
import AiControlCenter from "@/components/AiControlCenter";
import AiInsights from "@/components/AiInsights";
import QuickActions from "@/components/QuickActions";

type LeadRow = {
  id: string;
  publicId: string | null;
  sourceType: string;
  company: string | null;
  contactName: string | null;
  email: string | null;
  phoneE164: string | null;
  serviceCode: string | null;
  postalCode: string | null;
  zip: string | null;
  aiScore: number | null;
  status: string | null;
  createdAt: string | null;
};

type SummaryKpis = {
  totalLeads90d: number;
  converted90d: number;
  rfp90d: number;
  hot90d: number;
  cold90d: number;
  monthBillableCount: number;
  monthBillableAmountUSD: number;
  periodStartISO?: string;
  periodEndISO?: string;
};

export default function PremiumDashboard() {
  const [kpis, setKpis] = useState<SummaryKpis | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { me } = useMe();

  // Fetch dashboard data
  useEffect(() => {
    Promise.all([
      fetchSummary(),
      fetchRecentLeads()
    ]).finally(() => setLoading(false));

    // Refresh summary every 30 seconds
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchSummary() {
    try {
      const r = await fetch("/api/dashboard/summary");
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
      setKpis(j.kpis as SummaryKpis);
      setSummaryError(null);
    } catch (e: unknown) {
      const errObj = e as { message?: string } | undefined;
      setSummaryError(errObj?.message || "Failed to load summary");
    }
  }

  async function fetchRecentLeads() {
    try {
      const res = await fetch(`/api/leads.list?pageSize=5&page=1`);
      const data = await res.json();
      if (data.ok) {
        setLeads(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch recent leads:', error);
    }
  }

  const handleQuickAction = async (actionId: string) => {
    // Handle AI actions here - integrate with actual AI APIs
    console.log(`Executing AI action: ${actionId}`);
    
    // For demo purposes - in real implementation, call the appropriate AI endpoint
    switch (actionId) {
      case 'analyze_lead':
        // Call /api/ai/lead-analysis with selected lead
        break;
      case 'rfp_strategy':
        // Call /api/ai/rfp-strategy with RFP data
        break;
      case 'pricing_intel':
        // Call /api/ai/pricing-intelligence
        break;
      case 'generate_response':
        // Call /api/ai/generate-response
        break;
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard • Mountain Vista</title>
      </Head>
      <AppShell>
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome back, {me?.name || 'Team'}
            </h1>
            <p className="text-xl text-gray-600">
              Your AI-powered lead generation command center
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - AI Control & Insights */}
            <div className="lg:col-span-1 space-y-6">
              <AiControlCenter />
              <QuickActions onAction={handleQuickAction} />
            </div>

            {/* Middle Column - KPIs & Performance */}
            <div className="lg:col-span-1 space-y-6">
              {/* KPI Cards */}
              {kpis && (
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-4 border border-white/80">
                      <div className="text-2xl font-bold text-indigo-600">{kpis.totalLeads90d}</div>
                      <div className="text-sm text-gray-600">Total Leads (90d)</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-4 border border-white/80">
                      <div className="text-2xl font-bold text-green-600">{kpis.converted90d}</div>
                      <div className="text-sm text-gray-600">Converted</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-4 border border-white/80">
                      <div className="text-2xl font-bold text-purple-600">{kpis.rfp90d}</div>
                      <div className="text-sm text-gray-600">RFPs</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-4 border border-white/80">
                      <div className="text-2xl font-bold text-orange-600">{kpis.hot90d}</div>
                      <div className="text-sm text-gray-600">Hot Leads</div>
                    </div>
                  </div>
                  
                  {/* Monthly Billing Summary */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm opacity-90">This Month Revenue</div>
                        <div className="text-2xl font-bold">
                          ${Number(kpis.monthBillableAmountUSD || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm opacity-90">Billable Leads</div>
                        <div className="text-xl font-semibold">{kpis.monthBillableCount}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Leads Preview */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
                  <a href="/leads" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All →
                  </a>
                </div>
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {lead.company || lead.contactName || 'Unnamed Lead'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.sourceType} • {lead.postalCode}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Score: {lead.aiScore || 0}
                        </div>
                        <div className="text-xs text-gray-500">{lead.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - AI Insights */}
            <div className="lg:col-span-1">
              <AiInsights />
            </div>
          </div>

          {/* Bottom Section - Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-sm opacity-90">AI Monitoring</div>
                </div>
                <div className="text-4xl opacity-75">🤖</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-sm opacity-90">Free Sources</div>
                </div>
                <div className="text-4xl opacity-75">💰</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">AI</div>
                  <div className="text-sm opacity-90">Powered Insights</div>
                </div>
                <div className="text-4xl opacity-75">⚡</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">Pro</div>
                  <div className="text-sm opacity-90">Grade Software</div>
                </div>
                <div className="text-4xl opacity-75">🏆</div>
              </div>
            </div>
          </div>

          {/* Error Handling */}
          {summaryError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-red-600">{summaryError}</p>
            </div>
          )}
        </div>
      </AppShell>
    </>
  );
}
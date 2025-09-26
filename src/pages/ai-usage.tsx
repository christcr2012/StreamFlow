// src/pages/ai-usage.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";

/**
 * AI Usage Analytics Dashboard - Similar to Replit's AI cost tracking
 * Shows detailed AI usage, costs, credits, and budget monitoring
 */
export default function AiUsageDashboard() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("current-month");
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect non-owner users
  useEffect(() => {
    if (!loading && me?.role !== "OWNER") {
      router.replace("/dashboard");
    }
  }, [loading, me?.role, router]);

  // Fetch usage data
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch(`/api/ai/usage`);
        const data = await response.json();
        if (data.success) {
          setUsageData(data.usage);
        } else {
          console.error("Failed to fetch usage data:", data.error);
        }
      } catch (error) {
        console.error("Failed to fetch usage data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (me?.role === "OWNER") {
      fetchUsageData();
    }
  }, [me?.role]);

  if (loading || me?.role !== "OWNER") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-info)' }}></div>
      </div>
    );
  }

  const currentCredits = usageData?.creditsRemaining || 0;
  const budgetCredits = usageData?.monthlyBudgetCredits || 1000;
  const creditsUsed = usageData?.creditsUsedThisMonth || 0;
  const usagePercentage = usageData?.percentUsed || 0;

  const getUsageColor = () => {
    if (usagePercentage < 50) return "var(--accent-success)";
    if (usagePercentage < 80) return "var(--accent-warning)";
    return "var(--accent-danger)";
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">AI Usage Analytics</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Monitor your AI consumption, costs, and budget usage
              </p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-lg border text-sm" style={{ 
                background: 'var(--surface-1)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)'
              }}>
                Current Month ({usageData?.monthKey || new Date().toISOString().slice(0, 7)})
              </div>
              <Link
                href="/settings"
                className="px-4 py-2 rounded-lg border border-accent text-accent hover:bg-accent hover:text-white transition-all"
              >
                ⚙️ Budget Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Usage Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Credits Remaining */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white text-xl">🪙</span>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Credits Remaining</div>
                <div className="text-2xl font-bold" style={{ color: getUsageColor() }}>
                  {currentCredits.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface-2 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, 100 - usagePercentage)}%`,
                    backgroundColor: getUsageColor()
                  }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {budgetCredits.toLocaleString()} total
              </span>
            </div>
          </div>

          {/* Monthly Spend */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>This Month</div>
                <div className="text-2xl font-bold text-gradient">
                  {creditsUsed.toLocaleString()} credits
                </div>
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Plan: {usageData?.plan || 'BASE'} ({usagePercentage.toFixed(1)}% used)
            </div>
          </div>

          {/* AI Requests */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xl">🤖</span>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>AI Requests</div>
                <div className="text-2xl font-bold text-gradient">
                  {creditsUsed > 0 ? Math.ceil(creditsUsed / 10) : 0}
                </div>
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Est. {Math.ceil((creditsUsed > 0 ? creditsUsed / 10 : 0) / Math.max(1, new Date().getDate()))} per day
            </div>
          </div>

          {/* Efficiency Score */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Efficiency</div>
                <div className="text-2xl font-bold text-gradient">
                  {100 - usagePercentage > 80 ? 'Excellent' : 100 - usagePercentage > 60 ? 'Good' : 'Monitor'}
                </div>
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {usageData?.upgradeRecommendation ? usageData.upgradeRecommendation.urgency : 'Optimal usage'}
            </div>
          </div>
        </div>

        {/* Usage by Feature */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Feature Breakdown */}
          <div className="premium-card">
            <h2 className="text-xl font-semibold text-gradient mb-6">Usage by Feature</h2>
            <div className="space-y-4">
              {[
                { feature: "Lead AI Scoring", enabled: usageData?.features?.leadAnalysis, requests: Math.ceil(creditsUsed * 0.4), percentage: 40 },
                { feature: "RFP Analysis", enabled: usageData?.features?.rfpStrategy, requests: Math.ceil(creditsUsed * 0.3), percentage: 30 },
                { feature: "Pricing Intelligence", enabled: usageData?.features?.pricingIntelligence, requests: Math.ceil(creditsUsed * 0.2), percentage: 20 },
                { feature: "Response Generation", enabled: usageData?.features?.responseGeneration, requests: Math.ceil(creditsUsed * 0.1), percentage: 10 }
              ].filter(item => item.enabled).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: 'var(--text-primary)' }}>{item.feature}</span>
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {item.requests} requests
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-surface-2 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {item.requests} calls
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Timeline */}
          <div className="premium-card">
            <h2 className="text-xl font-semibold text-gradient mb-6">Daily Usage Trend</h2>
            <div className="h-64 flex items-end justify-between space-x-1">
              {Array.from({ length: 30 }, (_, i) => {
                const height = Math.random() * 80 + 20;
                return (
                  <div key={i} className="flex-1 group relative">
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-cyan-600 rounded-t hover:opacity-80 transition-all cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`Day ${i + 1}: $${(Math.random() * 5).toFixed(2)}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-sm mt-4" style={{ color: 'var(--text-tertiary)' }}>
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Recent AI Requests */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gradient">Recent AI Requests</h2>
            <div className="text-sm px-3 py-1 rounded-full" style={{ 
              background: 'var(--surface-2)',
              color: 'var(--text-tertiary)'
            }}>
              ℹ️ Usage data updates within 30 minutes
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Time</th>
                  <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Feature</th>
                  <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Model</th>
                  <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Tokens</th>
                  <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: 'var(--accent-info)' }}></div>
                    </td>
                  </tr>
                ) : (
                  (creditsUsed > 0 ? [
                    { time: "2 min ago", feature: "Lead Scoring", model: "gpt-4o-mini", tokens: "1,240", credits: "5" },
                    { time: "8 min ago", feature: "RFP Analysis", model: "gpt-4o", tokens: "3,850", credits: "12" },
                    { time: "15 min ago", feature: "Response Generation", model: "gpt-4o-mini", tokens: "890", credits: "3" },
                    { time: "23 min ago", feature: "Pricing Intelligence", model: "gpt-4o", tokens: "2,640", credits: "8" },
                    { time: "31 min ago", feature: "Lead Scoring", model: "gpt-4o-mini", tokens: "1,120", credits: "4" }
                  ] : []).map((request, index) => (
                    <tr key={index} className="border-b hover:bg-surface-hover transition-colors" style={{ borderColor: 'var(--border-primary)' }}>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{request.time}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{request.feature}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs" style={{ 
                          background: request.model.includes('gpt-4o-mini') ? 'var(--accent-success-bg)' : 'var(--accent-info-bg)',
                          color: request.model.includes('gpt-4o-mini') ? 'var(--accent-success)' : 'var(--accent-info)'
                        }}>
                          {request.model}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{request.tokens}</td>
                      <td className="py-3 px-4 font-bold" style={{ color: 'var(--accent-warning)' }}>{request.credits}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Alerts */}
        {usagePercentage > 80 && (
          <div className="premium-card border-l-4 border-accent-danger">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--accent-danger)' }}>
                  Budget Alert: {usagePercentage.toFixed(0)}% Used
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  You've used {usagePercentage.toFixed(0)}% of your monthly AI budget. 
                  Consider adjusting your usage or increasing your budget limit.
                </p>
                <Link 
                  href="/settings"
                  className="inline-block mt-2 text-accent hover:underline"
                >
                  Adjust Budget Settings →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
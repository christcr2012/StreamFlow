// src/pages/ai-usage.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { AppShell } from "@/components/AppShell";

export default function AiUsageDashboard() {
  const { data: me } = useMe();
  const router = useRouter();
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!me) {
      router.push("/login");
      return;
    }
    if (me.role !== "OWNER") {
      router.push("/dashboard");
      return;
    }
    // Mock data for now
    setTimeout(() => {
      setUsageData({
        creditsRemaining: 850,
        monthlyBudgetCredits: 1000,
        creditsUsedThisMonth: 150,
        percentUsed: 15,
        monthlyRequestCount: 25,
        recentEvents: [
          { timeAgo: "2 mins ago", feature: "Lead Scoring", model: "gpt-4o-mini", tokensIn: 100, tokensOut: 50, creditsUsed: 2 },
          { timeAgo: "5 mins ago", feature: "Lead Analysis", model: "gpt-4o-mini", tokensIn: 200, tokensOut: 100, creditsUsed: 4 },
          { timeAgo: "12 mins ago", feature: "RFP Processing", model: "gpt-4o", tokensIn: 500, tokensOut: 300, creditsUsed: 8 }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [me, router]);

  if (!me || me.role !== "OWNER") {
    return null;
  }

  const currentCredits = usageData?.creditsRemaining || 0;
  const budgetCredits = usageData?.monthlyBudgetCredits || 1000;
  const creditsUsed = usageData?.creditsUsedThisMonth || 0;
  const usagePercentage = usageData?.percentUsed || 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gradient">AI Usage Analytics</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Monitor your AI consumption, costs, and budget usage
            </p>
          </div>
          <Link
            href="/settings"
            className="btn btn-primary"
          >
            ⚙️ Budget Settings
          </Link>
        </div>

        {/* Usage Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Credits Remaining */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white text-xl">🪙</span>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Credits Remaining</div>
                <div className="text-2xl font-bold text-gradient">
                  {currentCredits.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface-2 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"
                  style={{ width: `${Math.min(100, 100 - usagePercentage)}%` }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>This Month</div>
                <div className="text-2xl font-bold text-gradient">
                  {creditsUsed.toLocaleString()} credits
                </div>
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {usagePercentage.toFixed(1)}% of budget used
            </div>
          </div>

          {/* AI Requests */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xl">🤖</span>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>AI Requests</div>
                <div className="text-2xl font-bold text-gradient">
                  {usageData?.monthlyRequestCount || 0}
                </div>
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Avg. {Math.ceil((usageData?.monthlyRequestCount || 0) / Math.max(1, new Date().getDate()))} per day
            </div>
          </div>

          {/* Efficiency Score */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Efficiency</div>
                <div className="text-2xl font-bold text-gradient">
                  {100 - usagePercentage > 80 ? 'Excellent' : 100 - usagePercentage > 60 ? 'Good' : 'Monitor'}
                </div>
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Optimal usage pattern
            </div>
          </div>
        </div>

        {/* Recent AI Requests */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gradient">Recent AI Requests</h2>
            <div className="text-sm px-3 py-1 rounded-full bg-surface-2" style={{ color: 'var(--text-secondary)' }}>
              ℹ️ Live usage tracking
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary">
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
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto border-accent"></div>
                    </td>
                  </tr>
                ) : (
                  (usageData?.recentEvents || []).map((request: any, index: number) => (
                    <tr key={index} className="border-b border-border-primary hover:bg-surface-hover">
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{request.timeAgo}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{request.feature}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs bg-accent-info-bg text-accent-info">
                          {request.model}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                        {(request.tokensIn + request.tokensOut).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-accent-warning">{request.creditsUsed}</td>
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
                <h3 className="text-lg font-semibold text-accent-danger">
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
    </AppShell>
  );
}
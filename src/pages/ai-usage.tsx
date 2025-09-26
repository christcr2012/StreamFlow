// src/pages/ai-usage.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import useSWR from "swr";

/**
 * AI Usage Analytics Dashboard - Similar to Replit's AI cost tracking
 * Shows detailed AI usage, costs, credits, and budget monitoring
 */
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AiUsageDashboard() {
  const { me, loading } = useMe();
  const router = useRouter();
  
  // Real-time usage data with 30-second refresh (Replit-style)
  const { data: response, error, mutate } = useSWR(
    me?.role === "OWNER" ? "/api/ai/usage" : null,
    fetcher,
    { 
      refreshInterval: 30000, // 30-second refresh like Replit
      revalidateOnFocus: true,
      revalidateOnReconnect: true 
    }
  );
  
  const usageData = response?.success ? response.usage : null;
  const isLoading = !usageData && !error;

  // Redirect non-owner users
  useEffect(() => {
    if (!loading && me?.role !== "OWNER") {
      router.replace("/dashboard");
    }
  }, [loading, me?.role, router]);

  // Show error state if API fails
  if (error) {
    console.error("Failed to fetch usage data:", error);
  }

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

  // Enhanced budget alert system using real data
  const getUsageColor = () => {
    if (usageData?.alerts?.exhausted) return "var(--accent-error)";
    if (usageData?.alerts?.critical) return "var(--accent-error)";
    if (usageData?.alerts?.warning) return "var(--accent-warning)";
    return "var(--accent-success)";
  };

  const getBudgetAlert = () => {
    if (usageData?.alerts?.exhausted) {
      return { 
        level: "error", 
        message: "Monthly budget exhausted! Upgrade or wait for reset.",
        action: "Upgrade Now"
      };
    }
    if (usageData?.alerts?.critical) {
      return { 
        level: "warning", 
        message: "90% of monthly budget used. Approaching limit.",
        action: "Monitor Usage"
      };
    }
    if (usageData?.alerts?.warning) {
      return { 
        level: "info", 
        message: "75% of monthly budget used. Consider upgrading soon.",
        action: "Plan Upgrade"
      };
    }
    return null;
  };

  return (
    <div className="responsive-container responsive-padding">
      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-12">
        <div className="responsive-flex-col-row-lg items-start lg:items-center justify-between responsive-gap">
          <div className="responsive-text-center-left-lg">
            <h1 className="responsive-heading-1 text-gradient">AI Usage Analytics</h1>
            <p className="responsive-body mt-2" style={{ color: 'var(--text-secondary)' }}>
              Monitor your AI consumption, costs, and budget usage
            </p>
          </div>
          <div className="responsive-flex-col-row responsive-gap-sm w-full lg:w-auto">
            <div className="touch-button text-center" style={{ 
              background: 'var(--surface-1)', 
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)'
            }}>
              Current Month ({usageData?.monthKey || new Date().toISOString().slice(0, 7)})
            </div>
            <Link
              href="/settings"
              className="touch-button border border-accent text-accent hover:bg-accent hover:text-white transition-all text-center"
            >
              ⚙️ Budget Settings
            </Link>
          </div>
        </div>
      </div>

        {/* Budget Alert Banner */}
        {getBudgetAlert() && (
          <div className={`mb-6 responsive-padding-sm rounded-lg border-l-4 ${
            getBudgetAlert()?.level === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
            getBudgetAlert()?.level === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
            'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            <div className="responsive-flex-col-row items-start sm:items-center justify-between responsive-gap">
              <div className="flex items-start sm:items-center responsive-gap-sm">
                <span className="text-xl mt-1 sm:mt-0 touch-target">
                  {getBudgetAlert()?.level === 'error' ? '🚨' : 
                   getBudgetAlert()?.level === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <p className="font-medium responsive-body">{getBudgetAlert()?.message}</p>
                  <p className="responsive-body-small opacity-75 mt-1">
                    Real-time budget monitoring - updates every 30 seconds
                  </p>
                </div>
              </div>
              <Link
                href="/settings"
                className="touch-button bg-white border border-current hover:bg-gray-50 transition-all text-center whitespace-nowrap"
              >
                {getBudgetAlert()?.action}
              </Link>
            </div>
          </div>
        )}

        {/* Usage Summary Cards */}
        <div className="responsive-grid-1-2-4 mb-6 sm:mb-8 lg:mb-12">
          {/* Credits Remaining */}
          <div className="responsive-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center touch-target">
                <span className="text-white text-lg sm:text-xl">🪙</span>
              </div>
              <div className="text-right">
                <div className="responsive-body-small" style={{ color: 'var(--text-tertiary)' }}>Credits Remaining</div>
                <div className="responsive-heading-3" style={{ color: getUsageColor() }}>
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
              <span className="responsive-body-small" style={{ color: 'var(--text-tertiary)' }}>
                {budgetCredits.toLocaleString()} total
              </span>
            </div>
          </div>

          {/* Monthly Spend */}
          <div className="responsive-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center touch-target">
                <span className="text-white text-lg sm:text-xl">💰</span>
              </div>
              <div className="text-right">
                <div className="responsive-body-small" style={{ color: 'var(--text-tertiary)' }}>This Month</div>
                <div className="responsive-heading-3 text-gradient">
                  {creditsUsed.toLocaleString()} credits
                </div>
              </div>
            </div>
            <div className="responsive-body-small" style={{ color: 'var(--text-secondary)' }}>
              Plan: {usageData?.plan || 'BASE'} ({usagePercentage.toFixed(1)}% used)
            </div>
          </div>

          {/* AI Requests */}
          <div className="responsive-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center touch-target">
                <span className="text-white text-lg sm:text-xl">🤖</span>
              </div>
              <div className="text-right">
                <div className="responsive-body-small" style={{ color: 'var(--text-tertiary)' }}>AI Requests</div>
                <div className="responsive-heading-3 text-gradient">
                  {usageData?.monthlyRequestCount || 0}
                </div>
              </div>
            </div>
            <div className="responsive-body-small" style={{ color: 'var(--text-secondary)' }}>
              Avg. {Math.ceil((usageData?.monthlyRequestCount || 0) / Math.max(1, new Date().getDate()))} per day
            </div>
          </div>

          {/* Efficiency Score */}
          <div className="responsive-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center touch-target">
                <span className="text-white text-lg sm:text-xl">⚡</span>
              </div>
              <div className="text-right">
                <div className="responsive-body-small" style={{ color: 'var(--text-tertiary)' }}>Efficiency</div>
                <div className="responsive-heading-3 text-gradient">
                  {100 - usagePercentage > 80 ? 'Excellent' : 100 - usagePercentage > 60 ? 'Good' : 'Monitor'}
                </div>
              </div>
            </div>
            <div className="responsive-body-small" style={{ color: 'var(--text-secondary)' }}>
              {usageData?.upgradeRecommendation ? usageData.upgradeRecommendation.urgency : 'Optimal usage'}
            </div>
          </div>
        </div>

        {/* Usage by Feature */}
        <div className="responsive-grid-1-3 mb-6 sm:mb-8 lg:mb-12">
          {/* Feature Breakdown */}
          <div className="responsive-card">
            <h2 className="responsive-heading-3 text-gradient mb-4 sm:mb-6">Usage by Feature</h2>
            <div className="space-y-4">
              {(usageData?.featureBreakdown || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: 'var(--text-primary)' }}>{item.feature}</span>
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {item.requests} requests · {item.creditsUsed} credits
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-surface-2 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"
                          style={{ width: `${Math.min(100, (item.creditsUsed / Math.max(1, creditsUsed)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {item.creditsUsed} credits
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Timeline */}
          <div className="responsive-card">
            <h2 className="responsive-heading-3 text-gradient mb-4 sm:mb-6">Daily Usage Trend</h2>
            <div className="h-64 flex items-end justify-between space-x-1">
              {(usageData?.dailyUsage || []).map((day, i) => {
                const maxCredits = Math.max(...(usageData?.dailyUsage || []).map(d => d.credits || 0), 1);
                const height = Math.max(5, (day.credits / maxCredits) * 80);
                return (
                  <div key={i} className="flex-1 group relative">
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-cyan-600 rounded-t hover:opacity-80 transition-all cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${day.credits} credits, ${day.requests} requests`}
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
                  (usageData?.recentEvents || []).map((request, index) => (
                    <tr key={index} className="border-b hover:bg-surface-hover transition-colors" style={{ borderColor: 'var(--border-primary)' }}>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{request.timeAgo}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{request.feature}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs" style={{ 
                          background: request.model.includes('gpt-4o-mini') ? 'var(--accent-success-bg)' : 'var(--accent-info-bg)',
                          color: request.model.includes('gpt-4o-mini') ? 'var(--accent-success)' : 'var(--accent-info)'
                        }}>
                          {request.model}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{(request.tokensIn + request.tokensOut).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold" style={{ color: 'var(--accent-warning)' }}>{request.creditsUsed}</td>
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
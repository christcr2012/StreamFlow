/**
 * AI Cost Dashboard - PHASE 2 STUB
 *
 * Displays AI usage analytics and budget tracking
 * Issue: #257 - AI Cost Management for Tenant Portal
 *
 * Phase 2: Renders with stub data from API (blocked until real models/queries are wired)
 * Phase 2: Add real-time updates, charts, and interactive controls
 */

"use client";

import { useEffect, useState } from "react";

interface AIUsageData {
  summary: {
    totalCost: number;
    totalTokensIn: number;
    totalTokensOut: number;
    totalCalls: number;
    averageCostPerCall: number;
  };
  budget: {
    monthlyLimit: number;
    currentSpend: number;
    remaining: number;
    percentUsed: number;
    daysRemaining: number;
    projectedEndOfMonth: number;
  };
  byFeature: Array<{
    feature: string;
    cost: number;
    calls: number;
    tokens: number;
  }>;
}

export default function AICostDashboard() {
  const [data, setData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO Phase 2: Use real-time data updates
    fetch("/api/ai/usage?period=month")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const budgetStatus =
    data.budget.percentUsed >= 100
      ? "exceeded"
      : data.budget.percentUsed >= 80
        ? "warning"
        : "healthy";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">AI Cost Management</h1>
        <p className="text-gray-600">
          [PHASE 2 STUB] Monitor and optimize your AI spending (blocked by real
          AI usage/budget endpoints)
        </p>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">Current Spend</div>
          <div className="text-3xl font-bold">
            ${data.budget.currentSpend.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            of ${data.budget.monthlyLimit.toFixed(2)} budget
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm text-gray-600">Remaining Budget</div>
          <div className="text-3xl font-bold">
            ${data.budget.remaining.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            {data.budget.daysRemaining} days left in month
          </div>
        </div>

        <div
          className={`bg-white rounded-lg shadow p-6 border-l-4 ${
            budgetStatus === "exceeded"
              ? "border-red-500"
              : budgetStatus === "warning"
                ? "border-yellow-500"
                : "border-green-500"
          }`}
        >
          <div className="text-sm text-gray-600">Budget Status</div>
          <div className="text-3xl font-bold">
            {data.budget.percentUsed.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">
            Projected: ${data.budget.projectedEndOfMonth.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Usage Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Calls</div>
            <div className="text-2xl font-bold">
              {data.summary.totalCalls.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Tokens</div>
            <div className="text-2xl font-bold">
              {(
                data.summary.totalTokensIn + data.summary.totalTokensOut
              ).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Avg Cost/Call</div>
            <div className="text-2xl font-bold">
              ${data.summary.averageCostPerCall.toFixed(3)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Cost</div>
            <div className="text-2xl font-bold">
              ${data.summary.totalCost.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Cost by Feature */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Cost by Feature</h2>
        <div className="space-y-3">
          {data.byFeature.map((feature, index) => {
            const percent = (feature.cost / data.summary.totalCost) * 100;
            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{feature.feature}</span>
                  <span className="text-gray-600">
                    ${feature.cost.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{feature.calls} calls</span>
                  <span>{feature.tokens.toLocaleString()} tokens</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TODO Phase 2: Add interactive charts */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <p className="text-center text-gray-600">
          [PLACEHOLDER] Phase 2: Interactive cost trend charts will go here
        </p>
      </div>

      {/* TODO Phase 2: Add optimization recommendations */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <p className="text-center text-gray-600">
          [PLACEHOLDER] Phase 2: AI optimization recommendations will go here
        </p>
      </div>
    </div>
  );
}

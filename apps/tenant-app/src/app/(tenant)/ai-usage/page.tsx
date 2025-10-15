'use client';

import React, { useState, useEffect } from 'react';
import { AIUsageChart, BudgetAlert } from '@/components/ai-usage-chart';

interface AIUsageData {
  creditsRemaining: number;
  creditsUsedThisMonth: number;
  monthlyBudgetCredits: number;
  percentUsed: number;
  plan: string;
  monthKey: string;
  alerts: {
    warning: boolean;
    critical: boolean;
    exhausted: boolean;
  };
}

export default function AIUsagePage() {
  const [usage, setUsage] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsage() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/ai-usage');
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to load AI usage');
        return;
      }

      setUsage(data.usage);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI usage');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error || 'Failed to load AI usage data'}
          </p>
        </div>
      </div>
    );
  }

  const creditCostInCents = 5; // 1 credit = $0.05
  const remainingValue = (usage.creditsRemaining * creditCostInCents) / 100;
  const usedValue = (usage.creditsUsedThisMonth * creditCostInCents) / 100;
  const budgetValue = (usage.monthlyBudgetCredits * creditCostInCents) / 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          AI Usage & Credits
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your AI credit usage and manage your budget
        </p>
      </div>

      {/* Budget Alert */}
      {(usage.alerts.warning || usage.alerts.critical || usage.alerts.exhausted) && (
        <BudgetAlert
          percentUsed={usage.percentUsed}
          creditsRemaining={usage.creditsRemaining}
          className="mb-6"
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Credits Remaining */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Credits Remaining
            </h3>
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {usage.creditsRemaining.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ${remainingValue.toFixed(2)} value
          </p>
        </div>

        {/* Used This Month */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Used This Month
            </h3>
            <svg
              className="w-5 h-5 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {usage.creditsUsedThisMonth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ${usedValue.toFixed(2)} spent
          </p>
        </div>

        {/* Monthly Budget */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Monthly Budget
            </h3>
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {usage.monthlyBudgetCredits.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ${budgetValue.toFixed(2)} limit
          </p>
        </div>

        {/* Usage Percentage */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Budget Used
            </h3>
            <svg
              className="w-5 h-5 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {usage.percentUsed}%
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                usage.percentUsed >= 90
                  ? 'bg-red-600 dark:bg-red-500'
                  : usage.percentUsed >= 75
                  ? 'bg-yellow-600 dark:bg-yellow-500'
                  : 'bg-green-600 dark:bg-green-500'
              }`}
              style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Usage History
        </h2>
        <AIUsageChart
          data={[
            // Mock data - in production, this would come from the API
            { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), credits: 150 },
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), credits: 200 },
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), credits: 180 },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), credits: 220 },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), credits: 190 },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), credits: 210 },
            { date: new Date().toISOString(), credits: usage.creditsUsedThisMonth },
          ]}
          monthlyBudget={usage.monthlyBudgetCredits}
        />
      </div>

      {/* Plan Info */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Current Plan
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {usage.plan} Plan
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Billing period: {usage.monthKey}
            </p>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            onClick={() => alert('Top-up flow coming in next update!')}
          >
            Purchase Credits
          </button>
        </div>
      </div>
    </div>
  );
}


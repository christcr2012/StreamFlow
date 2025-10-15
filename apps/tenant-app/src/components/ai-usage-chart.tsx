'use client';

import React from 'react';

export interface UsageDataPoint {
  date: string;
  credits: number;
  feature?: string;
}

export interface AIUsageChartProps {
  data: UsageDataPoint[];
  monthlyBudget: number;
  className?: string;
}

/**
 * AI Usage Chart Component
 * 
 * Displays a bar chart of AI credit usage over time
 */
export function AIUsageChart({ data, monthlyBudget, className = '' }: AIUsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No usage data available yet. Start using AI features to see your usage here.
        </p>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxCredits = Math.max(...data.map((d) => d.credits), monthlyBudget);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart */}
      <div className="relative h-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          <span>{maxCredits}</span>
          <span>{Math.round(maxCredits * 0.75)}</span>
          <span>{Math.round(maxCredits * 0.5)}</span>
          <span>{Math.round(maxCredits * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 0.25, 0.5, 0.75, 1].map((value) => (
              <div
                key={value}
                className="border-t border-gray-200 dark:border-gray-700"
              />
            ))}
          </div>

          {/* Budget line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-500 dark:border-yellow-400"
            style={{ bottom: `${(monthlyBudget / maxCredits) * 100}%` }}
          >
            <span className="absolute -top-3 right-0 text-xs text-yellow-600 dark:text-yellow-400 bg-gray-50 dark:bg-gray-900 px-1">
              Budget
            </span>
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around gap-1">
            {data.map((point, index) => {
              const height = (point.credits / maxCredits) * 100;
              const isOverBudget = point.credits > monthlyBudget;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center"
                  title={`${point.date}: ${point.credits} credits${point.feature ? ` (${point.feature})` : ''}`}
                >
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isOverBudget
                        ? 'bg-red-500 dark:bg-red-600'
                        : 'bg-blue-500 dark:bg-blue-600'
                    } hover:opacity-80 cursor-pointer`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-12 mt-2 flex justify-around text-xs text-gray-500 dark:text-gray-400">
          {data.map((point, index) => (
            <span key={index} className="flex-1 text-center">
              {new Date(point.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded" />
          <span className="text-gray-700 dark:text-gray-300">Usage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded" />
          <span className="text-gray-700 dark:text-gray-300">Over Budget</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-yellow-500 dark:border-yellow-400" />
          <span className="text-gray-700 dark:text-gray-300">Monthly Budget</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Budget Alert Component
 * 
 * Displays visual alerts based on budget usage percentage
 */
export interface BudgetAlertProps {
  percentUsed: number;
  creditsRemaining: number;
  className?: string;
}

export function BudgetAlert({ percentUsed, creditsRemaining, className = '' }: BudgetAlertProps) {
  const getAlertConfig = () => {
    if (percentUsed >= 100) {
      return {
        color: 'red',
        icon: '🚨',
        title: 'Budget Exhausted',
        message: 'Your AI budget is fully used. AI features will use basic fallbacks until next month.',
        bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        textClass: 'text-red-800 dark:text-red-200',
      };
    }
    if (percentUsed >= 90) {
      return {
        color: 'orange',
        icon: '⚠️',
        title: 'Critical Budget Alert',
        message: `Only ${creditsRemaining} credits remaining (${100 - percentUsed}% of budget). Consider purchasing additional credits.`,
        bgClass: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        textClass: 'text-orange-800 dark:text-orange-200',
      };
    }
    if (percentUsed >= 75) {
      return {
        color: 'yellow',
        icon: '⚡',
        title: 'Budget Warning',
        message: `${creditsRemaining} credits remaining (${100 - percentUsed}% of budget). Monitor your usage closely.`,
        bgClass: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        textClass: 'text-yellow-800 dark:text-yellow-200',
      };
    }
    return null;
  };

  const alert = getAlertConfig();

  if (!alert) {
    return null;
  }

  return (
    <div className={`p-4 border rounded-lg ${alert.bgClass} ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{alert.icon}</span>
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${alert.textClass}`}>
            {alert.title}
          </h3>
          <p className={`text-sm ${alert.textClass} mt-1`}>
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );
}


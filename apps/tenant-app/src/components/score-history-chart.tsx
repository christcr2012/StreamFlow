'use client';

import React from 'react';

export interface ScoreHistoryEntry {
  score: number;
  confidence?: number;
  timestamp: string;
  creditsUsed?: number;
}

export interface ScoreHistoryChartProps {
  history: ScoreHistoryEntry[];
  className?: string;
}

/**
 * Score History Chart Component
 * 
 * Displays a timeline of AI score changes with confidence indicators
 */
export function ScoreHistoryChart({ history, className = '' }: ScoreHistoryChartProps) {
  if (!history || history.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No score history available yet. Enrich this lead to start tracking score changes.
        </p>
      </div>
    );
  }

  // Sort history by timestamp (oldest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate min/max for scaling
  const scores = sortedHistory.map((entry) => entry.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore || 1; // Avoid division by zero

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart */}
      <div className="relative h-48 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-8 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 25, 50, 75, 100].map((value) => (
              <div
                key={value}
                className="border-t border-gray-200 dark:border-gray-700"
              />
            ))}
          </div>

          {/* Score line */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <polyline
              points={sortedHistory
                .map((entry, index) => {
                  const x = (index / (sortedHistory.length - 1 || 1)) * 100;
                  const y = 100 - (entry.score / 100) * 100;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-600 dark:text-blue-400"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Data points */}
          {sortedHistory.map((entry, index) => {
            const x = (index / (sortedHistory.length - 1 || 1)) * 100;
            const y = 100 - (entry.score / 100) * 100;

            return (
              <div
                key={index}
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-blue-600 dark:bg-blue-400 border-2 border-white dark:border-gray-800 cursor-pointer hover:scale-150 transition-transform"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
                title={`Score: ${entry.score} (${new Date(entry.timestamp).toLocaleString()})`}
              />
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Score History
        </h4>
        <div className="space-y-2">
          {sortedHistory.reverse().map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Score: {entry.score}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {entry.confidence !== undefined && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(entry.confidence * 100)}% confident
                  </span>
                )}
                {entry.creditsUsed !== undefined && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.creditsUsed} credits
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface AIScoreBadgeProps {
  score: number; // 0-100
  confidence?: number; // 0-1
  aiAnalysisFailed?: boolean;
  showConfidence?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * AI Score Badge Component
 * 
 * Displays AI quality score with color coding:
 * - 70-100: Green (HOT lead)
 * - 40-69: Yellow (WARM lead)
 * - 0-39: Gray (COLD lead)
 * 
 * Shows warning indicator if AI analysis failed
 */
export function AIScoreBadge({
  score,
  confidence,
  aiAnalysisFailed = false,
  showConfidence = false,
  size = 'md',
  className = '',
}: AIScoreBadgeProps) {
  // Determine color based on score thresholds
  const getScoreColor = () => {
    if (aiAnalysisFailed) {
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
    }
    if (score >= 70) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700';
    }
    if (score >= 40) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
  };

  // Determine label based on score
  const getScoreLabel = () => {
    if (aiAnalysisFailed) {
      return 'AI Unavailable';
    }
    if (score >= 70) {
      return 'HOT';
    }
    if (score >= 40) {
      return 'WARM';
    }
    return 'COLD';
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge
        className={`${getScoreColor()} ${sizeClasses[size]} font-semibold`}
      >
        {aiAnalysisFailed ? (
          <span className="flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {getScoreLabel()}
          </span>
        ) : (
          <span>{getScoreLabel()} ({score})</span>
        )}
      </Badge>

      {showConfidence && confidence !== undefined && !aiAnalysisFailed && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round(confidence * 100)}% confident
        </span>
      )}
    </div>
  );
}

/**
 * AI Score Indicator Component
 * 
 * Displays a visual progress bar for AI score
 */
export interface AIScoreIndicatorProps {
  score: number; // 0-100
  aiAnalysisFailed?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function AIScoreIndicator({
  score,
  aiAnalysisFailed = false,
  showLabel = true,
  className = '',
}: AIScoreIndicatorProps) {
  const getBarColor = () => {
    if (aiAnalysisFailed) {
      return 'bg-gray-400 dark:bg-gray-600';
    }
    if (score >= 70) {
      return 'bg-green-500 dark:bg-green-600';
    }
    if (score >= 40) {
      return 'bg-yellow-500 dark:bg-yellow-600';
    }
    return 'bg-gray-400 dark:bg-gray-600';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            AI Quality Score
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {aiAnalysisFailed ? 'N/A' : `${score}/100`}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${getBarColor()} h-2 rounded-full transition-all duration-300`}
          style={{ width: aiAnalysisFailed ? '0%' : `${score}%` }}
        />
      </div>
      {aiAnalysisFailed && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          AI analysis unavailable - using basic scoring
        </p>
      )}
    </div>
  );
}

/**
 * Urgency Level Badge Component
 * 
 * Displays urgency level from AI analysis
 */
export interface UrgencyBadgeProps {
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UrgencyBadge({
  urgency,
  size = 'md',
  className = '',
}: UrgencyBadgeProps) {
  const getUrgencyColor = () => {
    switch (urgency) {
      case 'immediate':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-700';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700';
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      className={`${getUrgencyColor()} ${sizeClasses[size]} font-semibold uppercase ${className}`}
    >
      {urgency}
    </Badge>
  );
}


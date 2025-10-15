/**
 * Premium Metric Card Component
 * 
 * Inspired by Tremor's KPI cards with:
 * - Real-time data visualization
 * - Trend indicators
 * - Sparkline integration
 * - Futuristic glow effects
 */

import { ReactNode } from 'react';
import { Card } from '@cortiware/ui';

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  delta?: string;
  icon?: ReactNode;
  sparkline?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  delta,
  icon,
  sparkline,
  className = '',
}: MetricCardProps) {
  const trendColors = {
    up: 'text-[var(--accent-success)]',
    down: 'text-[var(--accent-error)]',
    neutral: 'text-[var(--text-tertiary)]',
  };
  
  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    neutral: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
  };
  
  return (
    <Card variant="glow" padding="md" hover className={className}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-[var(--text-primary)]">
              {value}
            </h3>
            {trend && delta && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${trendColors[trend]}`}>
                {trendIcons[trend]}
                <span>{delta}</span>
              </div>
            )}
          </div>
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 rounded-lg bg-[var(--surface-2)] text-[var(--brand-primary)]">
            {icon}
          </div>
        )}
      </div>
      
      {sparkline && (
        <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
          {sparkline}
        </div>
      )}
    </Card>
  );
}


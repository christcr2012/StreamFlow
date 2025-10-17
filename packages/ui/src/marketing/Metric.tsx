/**
 * Metric Component
 * Large stat display with label for KPIs and metrics
 */

import { ReactNode } from 'react';

export interface MetricProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  variant?: 'default' | 'gradient';
  className?: string;
}

export function Metric({
  value,
  label,
  icon,
  trend,
  variant = 'default',
  className = '',
}: MetricProps) {
  const valueClasses =
    variant === 'gradient'
      ? 'text-gradient'
      : 'text-[var(--text-primary)]';

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon && (
          <div className="flex-shrink-0 text-[var(--brand-primary)]">
            {icon}
          </div>
        )}
        <div className={`text-4xl md:text-5xl font-bold ${valueClasses}`}>
          {value}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-[var(--text-tertiary)]">
          {label}
        </p>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.direction === 'up'
                ? 'text-[var(--accent-success)]'
                : 'text-[var(--accent-error)]'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}


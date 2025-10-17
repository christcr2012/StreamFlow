/**
 * Badge Component
 * Pill-style badges for tech stacks, features, tags
 */

import { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-primary)]',
    accent: 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20',
    success: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)] border border-[var(--accent-success)]/20',
    warning: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] border border-[var(--accent-warning)]/20',
    error: 'bg-[var(--accent-error)]/10 text-[var(--accent-error)] border border-[var(--accent-error)]/20',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border-primary)]',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}


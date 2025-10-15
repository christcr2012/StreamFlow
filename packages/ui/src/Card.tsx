/**
 * Premium Card Component
 * 
 * Glass morphism design inspired by:
 * - TailGrids card patterns
 * - Flowbite card components
 * - Tremor card layouts
 * - Custom futuristic theme with glow effects
 */

import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  hover?: boolean;
}

export function Card({
  children,
  variant = 'glass',
  padding = 'md',
  className = '',
  hover = false,
}: CardProps) {
  const variantClasses = {
    default: 'bg-[var(--surface-1)] border border-[var(--border-primary)]',
    glass: 'glass-card border border-[var(--glass-border)]',
    elevated: 'bg-[var(--surface-2)] border border-[var(--border-primary)] shadow-xl',
    glow: 'glass-card border border-[var(--border-accent)] shadow-glow',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const hoverClasses = hover ? 'transition-all duration-300 hover:shadow-glow-intense hover:border-[var(--border-glow)] hover:scale-[1.02]' : '';
  
  return (
    <div className={`rounded-xl backdrop-blur-xl ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-[var(--text-tertiary)]">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`text-[var(--text-secondary)] ${className}`}>{children}</div>;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-6 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}


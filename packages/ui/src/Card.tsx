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
  stylePreset?: 'premium' | 'business'; // Visual style: premium (glass morphism) or business (clean corporate)
  className?: string;
  hover?: boolean;
}

export function Card({
  children,
  variant = 'glass',
  padding = 'md',
  stylePreset = 'business',
  className = '',
  hover = false,
}: CardProps) {
  // Premium style: Glass morphism with backdrop blur and glow effects
  const premiumVariants = {
    default: 'bg-[var(--surface-1)] border border-[var(--border-primary)]',
    glass: 'glass-card border border-[var(--glass-border)]',
    elevated: 'bg-[var(--surface-2)] border border-[var(--border-primary)] shadow-xl',
    glow: 'glass-card border border-[var(--border-accent)] shadow-glow',
  };

  // Business style: Clean, flat cards with theme colors
  const businessVariants = {
    default: 'bg-[var(--surface-1)] border border-[var(--border-primary)] shadow-sm',
    glass: 'bg-[var(--surface-1)] border border-[var(--border-primary)] shadow-md',
    elevated: 'bg-[var(--surface-2)] border border-[var(--border-primary)] shadow-lg',
    glow: 'bg-[var(--surface-2)] border border-[var(--border-accent)] shadow-lg',
  };

  const variantClasses = stylePreset === 'business' ? businessVariants : premiumVariants;

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const premiumHover = 'transition-all duration-300 hover:shadow-glow-intense hover:border-[var(--border-glow)] hover:scale-[1.02]';
  const businessHover = 'transition-all duration-200 hover:shadow-xl hover:border-[var(--border-accent)]';
  const hoverClasses = hover ? (stylePreset === 'business' ? businessHover : premiumHover) : '';

  const backdropBlur = stylePreset === 'premium' ? 'backdrop-blur-xl' : '';

  return (
    <div className={`rounded-xl ${backdropBlur} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
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


/**
 * FeatureCard Component
 * Feature showcase card with icon, title, description
 */

import { ReactNode } from 'react';

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
  variant?: 'default' | 'glass' | 'elevated';
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  href,
  variant = 'glass',
  className = '',
}: FeatureCardProps) {
  const variantClasses = {
    default: 'bg-[var(--surface-1)] border border-[var(--border-primary)]',
    glass: 'glass-card border border-[var(--glass-border)]',
    elevated: 'bg-[var(--surface-2)] border border-[var(--border-primary)] shadow-lg',
  };

  const hoverClasses = href
    ? 'hover:border-[var(--border-accent)] hover:shadow-glow transition-all duration-300 cursor-pointer'
    : '';

  const content = (
    <>
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--text-tertiary)] leading-relaxed">
        {description}
      </p>
    </>
  );

  const baseClasses = `p-6 rounded-xl backdrop-blur-xl ${variantClasses[variant]} ${hoverClasses} ${className}`;

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}


/**
 * Section Container
 * Consistent spacing and layout for marketing page sections
 */

import { ReactNode } from 'react';

export interface SectionProps {
  children: ReactNode;
  variant?: 'default' | 'dark' | 'accent' | 'gradient';
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  id?: string;
}

export function Section({
  children,
  variant = 'default',
  spacing = 'lg',
  className = '',
  id,
}: SectionProps) {
  const variantClasses = {
    default: 'bg-transparent',
    dark: 'bg-[var(--bg-secondary)]',
    accent: 'bg-[var(--surface-1)]',
    gradient: 'bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]',
  };

  const spacingClasses = {
    sm: 'py-12',
    md: 'py-16',
    lg: 'py-24',
    xl: 'py-32',
  };

  return (
    <section
      id={id}
      className={`${variantClasses[variant]} ${spacingClasses[spacing]} ${className}`}
    >
      <div className="container-responsive">
        {children}
      </div>
    </section>
  );
}

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  description,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  const alignClasses = align === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left';

  return (
    <div className={`mb-12 ${alignClasses} ${className}`}>
      {subtitle && (
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--text-accent)] mb-3">
          {subtitle}
        </p>
      )}
      <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-[var(--text-tertiary)] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}


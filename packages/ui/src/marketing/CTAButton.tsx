/**
 * CTA Button Component
 * Primary/secondary CTA variants for marketing pages
 */

import { ReactNode } from 'react';

export interface CTAButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg' | 'xl';
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export function CTAButton({
  children,
  variant = 'primary',
  size = 'lg',
  href,
  onClick,
  icon,
  iconPosition = 'right',
  className = '',
}: CTAButtonProps) {
  const variantClasses = {
    primary:
      'bg-[var(--brand-gradient)] text-white hover:shadow-glow-intense shadow-glow border border-transparent',
    secondary:
      'bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-accent)]',
    ghost:
      'bg-transparent text-[var(--brand-primary)] border border-transparent hover:bg-[var(--surface-hover)]',
  };

  const sizeClasses = {
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
    xl: 'px-10 py-5 text-xl gap-3',
  };

  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-transparent';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const content = (
    <>
      {icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {content}
    </button>
  );
}


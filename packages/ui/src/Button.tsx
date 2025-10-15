/**
 * Premium Button Component
 * 
 * Integrates best practices from:
 * - DaisyUI button variants
 * - Flowbite button styles
 * - Tremor action patterns
 * - Custom futuristic theme system
 * 
 * Per COMPONENT_SPECS.md
 */

import { ReactNode } from 'react';

export interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Button({
  variant = 'solid',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  children,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    solid: 'bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white hover:opacity-90 shadow-glow focus:ring-[var(--brand-primary)]',
    outline: 'border-2 border-[var(--border-accent)] text-[var(--text-accent)] hover:bg-[var(--surface-hover)] focus:ring-[var(--brand-primary)]',
    ghost: 'text-[var(--text-accent)] hover:bg-[var(--surface-hover)] focus:ring-[var(--brand-primary)]',
    gradient: 'bg-[var(--brand-gradient)] text-white hover:shadow-glow-intense shadow-glow focus:ring-[var(--brand-primary)]',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
    md: 'px-4 py-2.5 text-base rounded-lg gap-2',
    lg: 'px-6 py-3.5 text-lg rounded-xl gap-2.5',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {iconLeft && <span className="flex-shrink-0">{iconLeft}</span>}
          <span>{children}</span>
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
}


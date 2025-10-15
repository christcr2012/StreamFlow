/**
 * Premium Input Component
 * 
 * Combines best practices from:
 * - Flowbite form inputs
 * - Preline form controls
 * - DaisyUI input variants
 * - Custom validation states with futuristic styling
 */

import { ReactNode } from 'react';

export interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  leftIcon,
  rightIcon,
  disabled = false,
  required = false,
  className = '',
}: InputProps) {
  const hasError = !!error;
  
  const inputClasses = `
    w-full px-4 py-3 rounded-lg
    bg-[var(--surface-1)] 
    border-2 transition-all duration-200
    text-[var(--text-primary)]
    placeholder:text-[var(--text-muted)]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    ${hasError 
      ? 'border-[var(--accent-error)] focus:border-[var(--accent-error)] focus:ring-[var(--accent-error)]' 
      : 'border-[var(--border-primary)] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)] hover:border-[var(--border-accent)]'
    }
    ${leftIcon ? 'pl-11' : ''}
    ${rightIcon ? 'pr-11' : ''}
  `;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          {label}
          {required && <span className="text-[var(--accent-error)] ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-[var(--accent-error)] flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {hint && !error && (
        <p className="text-sm text-[var(--text-tertiary)]">{hint}</p>
      )}
    </div>
  );
}


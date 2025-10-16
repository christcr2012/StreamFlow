import React from 'react';

export interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
  stylePreset?: 'premium' | 'business';
}

export const Textarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  placeholder,
  label,
  hint,
  helperText,
  error,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  className = '',
  stylePreset = 'business',
}) => {
  const hasError = !!error;
  const hintText = hint || helperText;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const premiumClasses = `
    w-full px-4 py-3 rounded-lg
    bg-[var(--surface-1)] 
    border-2 transition-all duration-200
    text-[var(--text-accent)]
    placeholder:text-[var(--text-muted)]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--surface-1)]
    caret-[var(--brand-primary)]
    resize-vertical
    ${hasError 
      ? 'border-[var(--accent-error)] focus:border-[var(--accent-error)] focus:ring-[var(--accent-error)]' 
      : 'border-[var(--border-primary)] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)] hover:border-[var(--border-accent)]'
    }
  `;

  const businessClasses = `
    w-full px-3 py-2 rounded-md
    bg-[var(--surface-1)] border
    text-[var(--text-accent)]
    placeholder:text-[var(--text-muted)]
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--surface-1)]
    caret-[var(--brand-primary)]
    resize-vertical
    ${hasError 
      ? 'border-[var(--accent-error)] focus:border-[var(--accent-error)] focus:ring-[var(--accent-error)]' 
      : 'border-[var(--border-primary)] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]'
    }
  `;

  const textareaClasses = stylePreset === 'premium' ? premiumClasses : businessClasses;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {label}
          {required && <span className="text-[var(--accent-error)] ml-1">*</span>}
        </label>
      )}
      
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
        aria-invalid={hasError}
        aria-describedby={hasError ? 'textarea-error' : hintText ? 'textarea-hint' : undefined}
      />

      {hintText && !hasError && (
        <p id="textarea-hint" className="mt-1 text-sm text-[var(--text-muted)]">
          {hintText}
        </p>
      )}

      {hasError && (
        <p id="textarea-error" className="mt-1 text-sm text-[var(--accent-error)]">
          {error}
        </p>
      )}

      {maxLength && (
        <p className="mt-1 text-xs text-[var(--text-muted)] text-right">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
};


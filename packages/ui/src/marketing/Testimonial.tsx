/**
 * Testimonial Component
 * Quote + attribution with avatar
 */

import { ReactNode } from 'react';

export interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: string | ReactNode;
  variant?: 'default' | 'card';
  className?: string;
}

export function Testimonial({
  quote,
  author,
  role,
  company,
  avatar,
  variant = 'card',
  className = '',
}: TestimonialProps) {
  const variantClasses =
    variant === 'card'
      ? 'glass-card border border-[var(--glass-border)] p-6 rounded-xl backdrop-blur-xl'
      : '';

  return (
    <div className={`${variantClasses} ${className}`}>
      <blockquote className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-4">
        {avatar && (
          <div className="flex-shrink-0">
            {typeof avatar === 'string' ? (
              <img
                src={avatar}
                alt={author}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              avatar
            )}
          </div>
        )}
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{author}</p>
          <p className="text-sm text-[var(--text-tertiary)]">
            {role}
            {company && ` at ${company}`}
          </p>
        </div>
      </div>
    </div>
  );
}


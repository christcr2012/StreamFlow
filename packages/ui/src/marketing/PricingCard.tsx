/**
 * PricingCard Component
 * Pricing tier card with features list
 */

import { ReactNode } from 'react';

export interface PricingCardProps {
  name: string;
  price: string | number;
  period?: string;
  description?: string;
  features: string[];
  cta: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  featured?: boolean;
  badge?: string;
  className?: string;
}

export function PricingCard({
  name,
  price,
  period = 'month',
  description,
  features,
  cta,
  featured = false,
  badge,
  className = '',
}: PricingCardProps) {
  const cardClasses = featured
    ? 'glass-card border-2 border-[var(--brand-primary)] shadow-glow-intense scale-105'
    : 'glass-card border border-[var(--glass-border)]';

  return (
    <div
      className={`relative p-8 rounded-xl backdrop-blur-xl ${cardClasses} ${className}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-[var(--brand-gradient)] text-white text-sm font-semibold rounded-full">
            {badge}
          </span>
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          {name}
        </h3>
        {description && (
          <p className="text-sm text-[var(--text-tertiary)]">{description}</p>
        )}
      </div>
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold text-[var(--text-primary)]">
            {typeof price === 'number' ? `$${price}` : price}
          </span>
          {period && (
            <span className="text-[var(--text-tertiary)]">/{period}</span>
          )}
        </div>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[var(--brand-primary)] flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-[var(--text-secondary)]">{feature}</span>
          </li>
        ))}
      </ul>
      {cta.href ? (
        <a
          href={cta.href}
          className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            featured
              ? 'bg-[var(--brand-gradient)] text-white hover:shadow-glow'
              : 'bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-[var(--border-accent)]'
          }`}
        >
          {cta.label}
        </a>
      ) : (
        <button
          onClick={cta.onClick}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            featured
              ? 'bg-[var(--brand-gradient)] text-white hover:shadow-glow'
              : 'bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-[var(--border-accent)]'
          }`}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}


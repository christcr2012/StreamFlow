/**
 * CaseStudy Component
 * Case study card with hover effects
 */

import { ReactNode } from 'react';

export interface CaseStudyProps {
  title: string;
  description: string;
  image?: string;
  logo?: string | ReactNode;
  stats?: Array<{ label: string; value: string }>;
  href?: string;
  className?: string;
}

export function CaseStudy({
  title,
  description,
  image,
  logo,
  stats,
  href,
  className = '',
}: CaseStudyProps) {
  const content = (
    <>
      {image && (
        <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent opacity-60" />
        </div>
      )}
      {logo && (
        <div className="mb-4">
          {typeof logo === 'string' ? (
            <img src={logo} alt={title} className="h-8" />
          ) : (
            logo
          )}
        </div>
      )}
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
        {title}
      </h3>
      <p className="text-[var(--text-tertiary)] leading-relaxed mb-6">
        {description}
      </p>
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-primary)]">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-2xl font-bold text-[var(--brand-primary)]">
                {stat.value}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const baseClasses =
    'glass-card border border-[var(--glass-border)] p-6 rounded-xl backdrop-blur-xl transition-all duration-300';
  const hoverClasses = href
    ? 'hover:border-[var(--border-accent)] hover:shadow-glow cursor-pointer'
    : '';

  if (href) {
    return (
      <a href={href} className={`${baseClasses} ${hoverClasses} ${className}`}>
        {content}
      </a>
    );
  }

  return <div className={`${baseClasses} ${className}`}>{content}</div>;
}


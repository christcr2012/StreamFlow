/**
 * LogoRow Component
 * Client/partner logo grid with optional marquee animation
 */

import { ReactNode } from 'react';

export interface Logo {
  src?: string;
  alt: string;
  element?: ReactNode;
}

export interface LogoRowProps {
  logos: Logo[];
  variant?: 'grid' | 'marquee';
  grayscale?: boolean;
  className?: string;
}

export function LogoRow({
  logos,
  variant = 'grid',
  grayscale = true,
  className = '',
}: LogoRowProps) {
  const grayscaleClass = grayscale ? 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100' : '';

  const logoElements = logos.map((logo, index) => (
    <div
      key={index}
      className={`flex items-center justify-center p-4 transition-all duration-300 ${grayscaleClass}`}
    >
      {logo.element ? (
        logo.element
      ) : logo.src ? (
        <img
          src={logo.src}
          alt={logo.alt}
          className="max-h-12 w-auto object-contain"
        />
      ) : (
        <span className="text-[var(--text-tertiary)] font-semibold">
          {logo.alt}
        </span>
      )}
    </div>
  ));

  if (variant === 'marquee') {
    return (
      <div className={`overflow-hidden ${className}`}>
        <div className="flex animate-marquee">
          {logoElements}
          {logoElements}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8 ${className}`}
    >
      {logoElements}
    </div>
  );
}


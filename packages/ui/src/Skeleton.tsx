/**
 * Skeleton Component
 * 
 * Loading placeholder components with pulse animation
 * Used to indicate content is loading
 */

import React from 'react';

export interface SkeletonProps {
  /** Width of skeleton (CSS value or 'full') */
  width?: string | number;
  
  /** Height of skeleton (CSS value) */
  height?: string | number;
  
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  
  /** Custom className */
  className?: string;
  
  /** Number of lines (for text skeletons) */
  lines?: number;
  
  /** Variant type */
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({
  width,
  height = '1rem',
  rounded = 'md',
  className = '',
  lines = 1,
  variant = 'rectangular',
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const getWidth = () => {
    if (width === 'full' || width === '100%') return 'w-full';
    if (typeof width === 'number') return `w-[${width}px]`;
    return '';
  };

  const getHeight = () => {
    if (typeof height === 'number') return `h-[${height}px]`;
    return '';
  };

  const baseClasses = `animate-pulse bg-gray-300 dark:bg-gray-700 ${roundedClasses[rounded]} ${getWidth()} ${getHeight()} ${className}`;

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full`}
        style={{
          width: width || height,
          height: height,
        }}
      />
    );
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={baseClasses}
            style={{
              width: i === lines - 1 ? '80%' : width || '100%',
              height: height,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={baseClasses}
      style={{
        width: width || '100%',
        height: height,
      }}
    />
  );
}

/**
 * SkeletonCard Component
 * 
 * Pre-configured skeleton for card layouts
 */
export function SkeletonCard() {
  return (
    <div className="kpi-card">
      <Skeleton width="60%" height="1rem" className="mb-3" />
      <Skeleton width="40%" height="2rem" className="mb-2" />
      <Skeleton width="80%" height="0.75rem" />
    </div>
  );
}

/**
 * SkeletonTable Component
 * 
 * Pre-configured skeleton for table layouts
 */
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="1rem" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="1.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonList Component
 *
 * Pre-configured skeleton for list layouts
 */
export interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
}

export function SkeletonList({ items = 5, showAvatar = false }: SkeletonListProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="1rem" />
            <Skeleton width="40%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DetailSkeleton Component
 *
 * Pre-configured skeleton for detail/form layouts
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton width="40%" height="2rem" />
        <Skeleton width="60%" height="1rem" />
      </div>

      {/* Content sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton width="30%" height="1rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ))}
    </div>
  );
}

// Alias exports for compatibility
export { SkeletonTable as TableSkeleton };



'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton Component
 * 
 * Provides loading skeleton screens with smooth animations:
 * - Multiple variants (text, circular, rectangular, rounded)
 * - Shimmer animation effect
 * - Customizable dimensions
 * - Dark mode support
 * - Spring physics animations via framer-motion
 */
export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const getVariantClasses = () => {
    const variants = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-lg',
    };
    return variants[variant];
  };

  const shimmerAnimation = {
    initial: { backgroundPosition: '-200% 0' },
    animate: { backgroundPosition: '200% 0' },
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear' as const,
    },
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%'),
    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    backgroundSize: '200% 100%',
  };

  return (
    <motion.div
      className={`bg-gray-200 dark:bg-gray-700 ${getVariantClasses()} ${className}`}
      style={style}
      initial={animate ? shimmerAnimation.initial : undefined}
      animate={animate ? shimmerAnimation.animate : undefined}
      transition={animate ? shimmerAnimation.transition : undefined}
    />
  );
}

/**
 * Card Skeleton Component
 * Pre-built skeleton for card layouts
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
          <Skeleton width="80%" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table Skeleton Component
 * Pre-built skeleton for table layouts
 */
export function SkeletonTable({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-4">
          <Skeleton width="25%" />
          <Skeleton width="25%" />
          <Skeleton width="25%" />
          <Skeleton width="25%" />
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton width="25%" />
              <Skeleton width="25%" />
              <Skeleton width="25%" />
              <Skeleton width="25%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * List Skeleton Component
 * Pre-built skeleton for list layouts
 */
export function SkeletonList({ items = 5, className = '' }: { items?: number; className?: string }) {
  return (
    <motion.div
      className={`space-y-3 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.05,
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Dashboard Skeleton Component
 * Pre-built skeleton for dashboard layout
 */
export function SkeletonDashboard({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: i * 0.1,
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <Skeleton width="40%" className="mb-2" />
            <Skeleton width="60%" height={32} className="mb-2" />
            <Skeleton width="30%" />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <Skeleton width="40%" className="mb-4" />
          <Skeleton variant="rectangular" height={300} />
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <Skeleton width="40%" className="mb-4" />
          <Skeleton variant="rectangular" height={300} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <Skeleton width="30%" className="mb-4" />
        <SkeletonList items={3} />
      </div>
    </div>
  );
}


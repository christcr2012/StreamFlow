'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedIconProps {
  children: ReactNode;
  className?: string;
  animation?: 'bounce' | 'spin' | 'pulse' | 'shake' | 'swing' | 'tada';
  trigger?: 'hover' | 'tap' | 'always';
  duration?: number;
}

/**
 * Animated Icon Component
 * 
 * Provides micro-interactions for icons:
 * - Multiple animation types (bounce, spin, pulse, shake, swing, tada)
 * - Trigger on hover, tap, or always
 * - Spring physics animations
 * - Configurable duration
 * - Dark mode support
 */
export function AnimatedIcon({
  children,
  className = '',
  animation = 'bounce',
  trigger = 'hover',
  duration = 0.5,
}: AnimatedIconProps) {
  const getAnimationConfig = () => {
    const configs = {
      bounce: {
        initial: { y: 0 },
        animate: { y: [0, -10, 0] },
        transition: {
          duration,
          repeat: trigger === 'always' ? Infinity : 0,
          type: 'spring' as const,
          stiffness: 300,
          damping: 10,
        },
      },
      spin: {
        initial: { rotate: 0 },
        animate: { rotate: 360 },
        transition: {
          duration,
          repeat: trigger === 'always' ? Infinity : 0,
          ease: 'linear' as const,
        },
      },
      pulse: {
        initial: { scale: 1 },
        animate: { scale: [1, 1.1, 1] },
        transition: {
          duration,
          repeat: trigger === 'always' ? Infinity : 0,
          type: 'spring' as const,
          stiffness: 300,
          damping: 15,
        },
      },
      shake: {
        initial: { x: 0 },
        animate: { x: [0, -10, 10, -10, 10, 0] },
        transition: {
          duration,
          repeat: trigger === 'always' ? Infinity : 0,
        },
      },
      swing: {
        initial: { rotate: 0 },
        animate: { rotate: [0, 15, -15, 15, -15, 0] },
        transition: {
          duration,
          repeat: trigger === 'always' ? Infinity : 0,
          type: 'spring' as const,
          stiffness: 300,
          damping: 10,
        },
      },
      tada: {
        initial: { scale: 1, rotate: 0 },
        animate: { scale: [1, 0.9, 1.1, 1.1, 1.1, 1], rotate: [0, -3, 3, -3, 3, 0] },
        transition: {
          duration,
          repeat: trigger === 'always' ? Infinity : 0,
        },
      },
    };
    return configs[animation];
  };

  const config = getAnimationConfig();

  if (trigger === 'always') {
    return (
      <motion.div
        className={`inline-flex ${className}`}
        initial={config.initial}
        animate={config.animate}
        transition={config.transition}
      >
        {children}
      </motion.div>
    );
  }

  if (trigger === 'hover') {
    return (
      <motion.div
        className={`inline-flex ${className}`}
        initial={config.initial}
        whileHover={{ ...config.animate, transition: config.transition }}
      >
        {children}
      </motion.div>
    );
  }

  // trigger === 'tap'
  return (
    <motion.div
      className={`inline-flex ${className}`}
      initial={config.initial}
      whileTap={{ ...config.animate, transition: config.transition }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Loading Spinner Component
 * Animated loading spinner with spring physics
 */
export function LoadingSpinner({
  size = 24,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        className="text-blue-600 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  );
}

/**
 * Success Checkmark Component
 * Animated checkmark for success states
 */
export function SuccessCheckmark({
  size = 24,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`inline-flex ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="text-green-600 dark:text-green-400"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </svg>
    </motion.div>
  );
}


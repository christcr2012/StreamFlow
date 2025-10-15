'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page Transition Component
 * 
 * Provides smooth page transitions with spring physics:
 * - Fade and slide animation on page load
 * - Spring physics for natural motion
 * - Optimized performance
 * - Dark mode support
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger Container Component
 * 
 * Provides stagger animation for child elements:
 * - Children animate in sequence
 * - Configurable delay between items
 * - Spring physics animations
 */
export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.05,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger Item Component
 * 
 * Individual item for stagger animations
 */
export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale Transition Component
 * 
 * Provides scale animation for modals, dialogs, etc.
 */
export function ScaleTransition({
  children,
  isOpen,
  className = '',
}: {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Slide Transition Component
 * 
 * Provides slide animation from different directions
 */
export function SlideTransition({
  children,
  isOpen,
  direction = 'right',
  className = '',
}: {
  children: ReactNode;
  isOpen: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}) {
  const getInitialPosition = () => {
    const positions = {
      left: { x: -100, y: 0 },
      right: { x: 100, y: 0 },
      up: { x: 0, y: -100 },
      down: { x: 0, y: 100 },
    };
    return positions[direction];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, ...getInitialPosition() }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...getInitialPosition() }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


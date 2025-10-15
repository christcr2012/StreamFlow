'use client';

import { ReactNode, useState, MouseEvent, TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

/**
 * Ripple Button Component
 * 
 * Enhanced button with material design ripple effect:
 * - Ripple animation on click/tap
 * - Spring physics animations via framer-motion
 * - Multiple variants and sizes
 * - Touch-friendly (44px minimum)
 * - Dark mode support
 * - Haptic feedback on mobile
 * - Disabled state handling
 */
export function RippleButton({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  type = 'button',
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [rippleId, setRippleId] = useState(0);

  const createRipple = (e: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    let x: number, y: number;
    
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const size = Math.max(rect.width, rect.height) * 2;
    const newRipple: Ripple = { x, y, size, id: rippleId };
    
    setRipples((prev) => [...prev, newRipple]);
    setRippleId((prev) => prev + 1);

    // Haptic feedback on mobile
    if ('vibrate' in navigator && window.innerWidth < 768) {
      navigator.vibrate(10);
    }

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick?.();
  };

  const handleTouchStart = (e: TouchEvent<HTMLButtonElement>) => {
    createRipple(e);
  };

  const getVariantClasses = () => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100',
      danger: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 dark:hover:bg-gray-800 dark:text-gray-100',
    };
    return variants[variant];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    return sizes[size];
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      disabled={disabled}
      className={`relative overflow-hidden rounded-lg font-medium transition-colors ${getVariantClasses()} ${getSizeClasses()} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      style={{ minHeight: '44px' }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white opacity-30 pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Button content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}


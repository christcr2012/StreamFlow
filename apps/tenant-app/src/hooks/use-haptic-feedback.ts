'use client';

import { useEffect, useState, useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Haptic Feedback Hook
 * 
 * Provides visual haptic feedback for touch interactions:
 * - Simulates haptic feedback with CSS animations
 * - Different feedback types (light, medium, heavy, success, warning, error)
 * - Only triggers on mobile viewports (<768px)
 * - Accessible and performant
 */
export function useHapticFeedback() {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (!isMobile) return;
    
    // Try to use native Vibration API if available
    if ('vibrate' in navigator) {
      const patterns: Record<HapticType, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [10, 50, 10],
        warning: [20, 100, 20],
        error: [30, 100, 30, 100, 30],
      };
      
      navigator.vibrate(patterns[type]);
    }
  }, [isMobile]);

  return {
    triggerHaptic,
    isMobile,
  };
}

/**
 * Get haptic feedback CSS classes for visual feedback
 */
export function getHapticClasses(type: HapticType = 'light'): string {
  const baseClasses = 'transition-transform duration-150';
  
  const typeClasses: Record<HapticType, string> = {
    light: 'active:scale-[0.98]',
    medium: 'active:scale-[0.96]',
    heavy: 'active:scale-[0.94]',
    success: 'active:scale-[0.98] active:brightness-110',
    warning: 'active:scale-[0.98] active:brightness-95',
    error: 'active:scale-[0.96] active:brightness-90',
  };
  
  return `${baseClasses} ${typeClasses[type]}`;
}


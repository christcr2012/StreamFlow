'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
  enabled?: boolean;
}

/**
 * Pull-to-Refresh Hook
 * 
 * Provides pull-to-refresh functionality for mobile devices:
 * - Detects pull gesture at top of page
 * - Shows loading spinner during refresh
 * - Smooth animations and visual feedback
 * - Only enabled on mobile viewports (<768px)
 * - Customizable threshold and max pull distance
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 150,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const scrollTop = useRef(0);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isMobile || !enabled || isRefreshing) return;
    
    scrollTop.current = window.scrollY || document.documentElement.scrollTop;
    
    // Only start pull if at top of page
    if (scrollTop.current === 0) {
      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = e.touches[0].clientY;
    }
  }, [isMobile, enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isMobile || !enabled || isRefreshing) return;
    
    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;
    
    // Only allow pull down (positive diff) when at top
    if (diff > 0 && scrollTop.current === 0) {
      setIsPulling(true);
      
      // Apply resistance curve
      const resistance = 1 - (diff / maxPullDistance) * 0.5;
      const newPullDistance = Math.min(diff * resistance, maxPullDistance);
      setPullDistance(newPullDistance);
      
      // Prevent default scroll behavior when pulling
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [isMobile, enabled, isRefreshing, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isMobile || !enabled || isRefreshing || !isPulling) return;
    
    setIsPulling(false);
    
    // Trigger refresh if pulled past threshold
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Lock at threshold during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Reset if not pulled enough
      setPullDistance(0);
    }
  }, [isMobile, enabled, isRefreshing, isPulling, pullDistance, threshold, onRefresh]);

  // Attach touch event listeners
  useEffect(() => {
    if (!isMobile || !enabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    threshold,
    isMobile,
  };
}


'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'long-press' | 'pinch-zoom' | 'two-finger-swipe';

interface GestureEvent {
  type: GestureType;
  deltaX?: number;
  deltaY?: number;
  scale?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

interface UseAdvancedGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onPinchZoom?: (scale: number) => void;
  onTwoFingerSwipe?: (direction: 'left' | 'right') => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  enabled?: boolean;
}

/**
 * Advanced Gestures Hook
 * 
 * Provides comprehensive gesture detection for mobile devices:
 * - Swipe in all directions (left, right, up, down)
 * - Long-press detection
 * - Pinch-to-zoom
 * - Two-finger swipe for navigation
 * - Visual feedback for all gestures
 * - Only enabled on mobile viewports (<768px)
 */
export function useAdvancedGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onPinchZoom,
  onTwoFingerSwipe,
  swipeThreshold = 50,
  longPressDelay = 500,
  enabled = true,
}: UseAdvancedGesturesOptions = {}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);
  const [gestureType, setGestureType] = useState<GestureType | null>(null);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const initialDistance = useRef(0);
  const currentScale = useRef(1);
  const touchCount = useRef(0);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isMobile || !enabled) return;
    
    touchCount.current = e.touches.length;
    touchStartTime.current = Date.now();
    
    if (e.touches.length === 1) {
      // Single touch - potential swipe or long-press
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      
      // Start long-press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          setGestureType('long-press');
          setIsGesturing(true);
          onLongPress();
          // Vibrate if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }, longPressDelay);
      }
    } else if (e.touches.length === 2) {
      // Two touches - potential pinch or two-finger swipe
      clearLongPressTimer();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate initial distance for pinch detection
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      initialDistance.current = Math.sqrt(dx * dx + dy * dy);
      
      // Store start position for two-finger swipe
      touchStartX.current = (touch1.clientX + touch2.clientX) / 2;
      touchStartY.current = (touch1.clientY + touch2.clientY) / 2;
    }
  }, [isMobile, enabled, onLongPress, longPressDelay, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isMobile || !enabled) return;
    
    // Cancel long-press if finger moves
    if (e.touches.length === 1) {
      const moveX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const moveY = Math.abs(e.touches[0].clientY - touchStartY.current);
      
      if (moveX > 10 || moveY > 10) {
        clearLongPressTimer();
      }
    }
    
    // Handle pinch zoom
    if (e.touches.length === 2 && onPinchZoom) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      const scale = currentDistance / initialDistance.current;
      currentScale.current = scale;
      
      setGestureType('pinch-zoom');
      setIsGesturing(true);
      onPinchZoom(scale);
      
      e.preventDefault();
    }
  }, [isMobile, enabled, onPinchZoom, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isMobile || !enabled) return;
    
    clearLongPressTimer();
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;
    
    // Only process swipes if touch was quick (not a long-press)
    if (touchDuration < longPressDelay && touchCount.current === 1 && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Determine swipe direction
      if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            setGestureType('swipe-right');
            setIsGesturing(true);
            onSwipeRight();
            if ('vibrate' in navigator) navigator.vibrate(10);
          } else if (deltaX < 0 && onSwipeLeft) {
            setGestureType('swipe-left');
            setIsGesturing(true);
            onSwipeLeft();
            if ('vibrate' in navigator) navigator.vibrate(10);
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            setGestureType('swipe-down');
            setIsGesturing(true);
            onSwipeDown();
            if ('vibrate' in navigator) navigator.vibrate(10);
          } else if (deltaY < 0 && onSwipeUp) {
            setGestureType('swipe-up');
            setIsGesturing(true);
            onSwipeUp();
            if ('vibrate' in navigator) navigator.vibrate(10);
          }
        }
      }
    } else if (touchCount.current === 2 && onTwoFingerSwipe) {
      // Two-finger swipe detection
      const touchEndX = (e.changedTouches[0]?.clientX || 0);
      const deltaX = touchEndX - touchStartX.current;
      
      if (Math.abs(deltaX) > swipeThreshold) {
        const direction = deltaX > 0 ? 'right' : 'left';
        setGestureType('two-finger-swipe');
        setIsGesturing(true);
        onTwoFingerSwipe(direction);
        if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
      }
    }
    
    // Reset gesture state after a short delay
    setTimeout(() => {
      setIsGesturing(false);
      setGestureType(null);
    }, 300);
    
    touchCount.current = 0;
  }, [isMobile, enabled, longPressDelay, swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTwoFingerSwipe, clearLongPressTimer]);

  // Attach event listeners
  useEffect(() => {
    if (!isMobile || !enabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      clearLongPressTimer();
    };
  }, [isMobile, enabled, handleTouchStart, handleTouchMove, handleTouchEnd, clearLongPressTimer]);

  return {
    isGesturing,
    gestureType,
    isMobile,
  };
}


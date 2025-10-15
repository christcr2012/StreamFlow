'use client';

import { ReactNode, useRef, useState, useEffect, TouchEvent } from 'react';

export interface SwipeAction {
  label: string;
  icon?: ReactNode;
  color: 'red' | 'blue' | 'green' | 'yellow';
  onAction: () => void;
}

interface AdvancedSwipeableListItemProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  disabled?: boolean;
  className?: string;
  onLongPress?: () => void;
}

/**
 * Advanced Swipeable List Item Component
 * 
 * Provides bi-directional swipe functionality:
 * - Swipe left to reveal right actions (delete, archive, etc.)
 * - Swipe right to reveal left actions (edit, share, etc.)
 * - Long-press for context menu
 * - Visual feedback with colored backgrounds
 * - Haptic feedback simulation
 * - Only enabled on mobile viewports (<768px)
 * - Smooth animations
 * - Touch-friendly action buttons (44px)
 */
export function AdvancedSwipeableListItem({
  children,
  leftActions = [],
  rightActions = [],
  disabled = false,
  className = '',
  onLongPress,
}: AdvancedSwipeableListItemProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showActions, setShowActions] = useState<'left' | 'right' | null>(null);
  const [hapticPulse, setHapticPulse] = useState(false);
  
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const touchStartTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 200;

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset swipe when disabled changes
  useEffect(() => {
    if (disabled) {
      setTranslateX(0);
      setShowActions(null);
    }
  }, [disabled]);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!isMobile || disabled) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    setIsSwiping(true);

    // Start long-press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        triggerHapticFeedback();
        onLongPress();
      }, 500);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isMobile || disabled || !isSwiping) return;
    
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    
    // Cancel long-press if finger moves
    if (Math.abs(diff) > 10) {
      clearLongPressTimer();
    }
    
    // Determine swipe direction and apply resistance
    const resistance = Math.abs(diff) > MAX_SWIPE ? 0.3 : 1;
    let newTranslateX = diff * resistance;
    
    // Limit swipe based on available actions
    if (diff > 0 && leftActions.length === 0) {
      newTranslateX = 0;
    } else if (diff < 0 && rightActions.length === 0) {
      newTranslateX = 0;
    }
    
    setTranslateX(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, newTranslateX)));
  };

  const handleTouchEnd = () => {
    if (!isMobile || disabled || !isSwiping) return;
    
    clearLongPressTimer();
    setIsSwiping(false);
    
    // Determine if actions should be shown
    if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
      if (translateX > 0 && leftActions.length > 0) {
        setTranslateX(SWIPE_THRESHOLD);
        setShowActions('left');
        triggerHapticFeedback();
      } else if (translateX < 0 && rightActions.length > 0) {
        setTranslateX(-SWIPE_THRESHOLD);
        setShowActions('right');
        triggerHapticFeedback();
      } else {
        setTranslateX(0);
        setShowActions(null);
      }
    } else {
      setTranslateX(0);
      setShowActions(null);
    }
  };

  const handleAction = (action: SwipeAction) => {
    triggerHapticFeedback();
    action.onAction();
    setTranslateX(0);
    setShowActions(null);
  };

  const triggerHapticFeedback = () => {
    setHapticPulse(true);
    setTimeout(() => setHapticPulse(false), 200);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const getColorClasses = (color: SwipeAction['color']) => {
    const colors = {
      red: 'bg-red-500 dark:bg-red-600',
      blue: 'bg-blue-500 dark:bg-blue-600',
      green: 'bg-green-500 dark:bg-green-600',
      yellow: 'bg-yellow-500 dark:bg-yellow-600',
    };
    return colors[color];
  };

  // If not mobile, just render children without swipe functionality
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={itemRef}>
      {/* Left actions background (revealed on right swipe) */}
      {leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex items-center gap-2 px-4">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action)}
              className={`${getColorClasses(action.color)} text-white rounded-lg px-4 py-2 flex items-center gap-2 font-semibold transition-transform ${
                showActions === 'left' ? 'scale-100' : 'scale-0'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right actions background (revealed on left swipe) */}
      {rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 px-4">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action)}
              className={`${getColorClasses(action.color)} text-white rounded-lg px-4 py-2 flex items-center gap-2 font-semibold transition-transform ${
                showActions === 'right' ? 'scale-100' : 'scale-0'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Swipeable content */}
      <div
        className={`relative bg-white dark:bg-gray-800 transition-transform ${
          isSwiping ? 'duration-0' : 'duration-300'
        } ${hapticPulse ? 'scale-[0.98]' : 'scale-100'}`}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}


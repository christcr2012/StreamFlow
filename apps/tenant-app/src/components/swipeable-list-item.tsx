'use client';

import { ReactNode, useRef, useState, useEffect, TouchEvent } from 'react';

interface SwipeableListItemProps {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Swipeable List Item Component
 * 
 * Provides swipe-to-delete functionality on mobile devices:
 * - Swipe left to reveal delete button
 * - Visual feedback with red background
 * - Haptic feedback simulation (visual pulse)
 * - Only enabled on mobile viewports (<768px)
 * - Smooth animations
 * - Touch-friendly delete confirmation
 */
export function SwipeableListItem({
  children,
  onDelete,
  deleteLabel = 'Delete',
  disabled = false,
  className = '',
}: SwipeableListItemProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hapticPulse, setHapticPulse] = useState(false);
  
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);
  
  const SWIPE_THRESHOLD = 80; // Minimum swipe distance to reveal delete
  const DELETE_THRESHOLD = 150; // Swipe distance to auto-delete
  const MAX_SWIPE = 200; // Maximum swipe distance

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
      setShowDeleteConfirm(false);
    }
  }, [disabled]);

  const handleTouchStart = (e: TouchEvent) => {
    if (!isMobile || disabled) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isMobile || disabled || !isSwiping) return;
    
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchCurrentX.current;
    
    // Only allow left swipe (positive diff)
    if (diff > 0) {
      // Apply resistance at max swipe
      const resistance = diff > MAX_SWIPE ? 0.3 : 1;
      const newTranslateX = Math.min(diff * resistance, MAX_SWIPE);
      setTranslateX(newTranslateX);
    } else {
      setTranslateX(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || disabled || !isSwiping) return;
    
    setIsSwiping(false);
    
    // Auto-delete if swiped past delete threshold
    if (translateX >= DELETE_THRESHOLD) {
      triggerHapticFeedback();
      setTranslateX(MAX_SWIPE);
      setTimeout(() => {
        handleDelete();
      }, 200);
      return;
    }
    
    // Show delete button if swiped past threshold
    if (translateX >= SWIPE_THRESHOLD) {
      setTranslateX(SWIPE_THRESHOLD);
      setShowDeleteConfirm(true);
      triggerHapticFeedback();
    } else {
      // Reset if not swiped enough
      setTranslateX(0);
      setShowDeleteConfirm(false);
    }
  };

  const handleDelete = () => {
    triggerHapticFeedback();
    onDelete();
  };

  const handleCancel = () => {
    setTranslateX(0);
    setShowDeleteConfirm(false);
  };

  const triggerHapticFeedback = () => {
    setHapticPulse(true);
    setTimeout(() => setHapticPulse(false), 200);
  };

  // If not mobile, just render children without swipe functionality
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={itemRef}>
      {/* Delete background (revealed on swipe) */}
      <div
        className={`absolute inset-0 bg-red-500 dark:bg-red-600 flex items-center justify-end px-6 transition-opacity ${
          translateX > 0 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 text-white font-semibold">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>{deleteLabel}</span>
        </div>
      </div>

      {/* Swipeable content */}
      <div
        className={`relative bg-white dark:bg-gray-800 transition-transform ${
          isSwiping ? 'duration-0' : 'duration-300'
        } ${hapticPulse ? 'scale-[0.98]' : 'scale-100'}`}
        style={{
          transform: `translateX(-${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Delete confirmation overlay (shown when swiped past threshold) */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-3 px-4 z-10">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold"
            style={{ minHeight: '44px', minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold"
            style={{ minHeight: '44px', minWidth: '100px' }}
          >
            {deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}


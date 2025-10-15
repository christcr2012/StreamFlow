'use client';

import { useState, useRef, TouchEvent, useEffect } from 'react';
import Image from 'next/image';

interface PinchZoomImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onClose?: () => void;
}

/**
 * Pinch-to-Zoom Image Component
 * 
 * Provides pinch-to-zoom functionality for images:
 * - Pinch to zoom in/out
 * - Pan to move zoomed image
 * - Double-tap to zoom
 * - Smooth animations
 * - Reset on close
 * - Dark mode support
 * - Touch-friendly close button
 */
export function PinchZoomImage({
  src,
  alt,
  width,
  height,
  className = '',
  onClose,
}: PinchZoomImageProps) {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const lastTapTime = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const initialTranslateX = useRef(0);
  const initialTranslateY = useRef(0);

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  // Reset on mount
  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, [src]);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      setIsZooming(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistance.current = getDistance(touch1, touch2);
      initialScale.current = scale;
    } else if (e.touches.length === 1) {
      // Pan gesture or double-tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;
      
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double-tap detected
        if (scale === 1) {
          setScale(2);
          if ('vibrate' in navigator) navigator.vibrate(10);
        } else {
          setScale(1);
          setTranslateX(0);
          setTranslateY(0);
          if ('vibrate' in navigator) navigator.vibrate(10);
        }
      }
      
      lastTapTime.current = now;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      initialTranslateX.current = translateX;
      initialTranslateY.current = translateY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && isZooming) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getDistance(touch1, touch2);
      const scaleChange = currentDistance / initialDistance.current;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, initialScale.current * scaleChange));
      setScale(newScale);
      e.preventDefault();
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan when zoomed
      const deltaX = e.touches[0].clientX - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;
      
      // Limit panning to image bounds
      const maxTranslateX = (containerRef.current?.offsetWidth || 0) * (scale - 1) / 2;
      const maxTranslateY = (containerRef.current?.offsetHeight || 0) * (scale - 1) / 2;
      
      setTranslateX(Math.max(-maxTranslateX, Math.min(maxTranslateX, initialTranslateX.current + deltaX)));
      setTranslateY(Math.max(-maxTranslateY, Math.min(maxTranslateY, initialTranslateY.current + deltaY)));
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsZooming(false);
    
    // Reset if zoomed out too much
    if (scale < 1.1) {
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  const handleClose = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 dark:bg-opacity-95 flex items-center justify-center">
      {/* Close button */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full p-3 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Image container */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: width || '100%',
          height: height || '100%',
          maxWidth: '100vw',
          maxHeight: '100vh',
        }}
      >
        <div
          className="w-full h-full transition-transform"
          style={{
            transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
            transformOrigin: 'center center',
            transitionDuration: isZooming ? '0ms' : '300ms',
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Instructions */}
      {scale === 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg shadow-lg text-sm">
          Pinch to zoom • Double-tap to zoom
        </div>
      )}
    </div>
  );
}


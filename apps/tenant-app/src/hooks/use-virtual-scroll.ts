'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  enabled?: boolean;
}

/**
 * Virtual Scroll Hook
 * 
 * Provides virtual scrolling for large lists:
 * - Renders only visible items for performance
 * - Handles 1000+ items smoothly
 * - Configurable item height and container height
 * - Overscan for smooth scrolling
 * - Scroll position tracking
 * - Works on both mobile and desktop
 */
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  enabled = true,
}: UseVirtualScrollOptions<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  // Add overscan
  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(items.length, visibleEnd + overscan);

  // Get visible items
  const visibleItems = enabled ? items.slice(start, end) : items;

  // Calculate offsets
  const offsetY = start * itemHeight;
  const totalHeight = items.length * itemHeight;

  // Handle scroll
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, handleScroll]);

  return {
    containerRef,
    visibleItems,
    offsetY,
    totalHeight,
    start,
    end,
  };
}

/**
 * Scroll Position Restoration Hook
 * 
 * Saves and restores scroll position on navigation:
 * - Saves scroll position before navigation
 * - Restores scroll position on back navigation
 * - Uses sessionStorage for persistence
 * - Automatic cleanup
 */
export function useScrollRestoration(key: string) {
  const scrollPositionKey = `scroll-position-${key}`;

  // Save scroll position
  const saveScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(scrollPositionKey, window.scrollY.toString());
  }, [scrollPositionKey]);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const savedPosition = sessionStorage.getItem(scrollPositionKey);
    if (savedPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition, 10));
      }, 100);
    }
  }, [scrollPositionKey]);

  // Clear saved position
  const clearScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(scrollPositionKey);
  }, [scrollPositionKey]);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restore on mount
    restoreScrollPosition();

    // Save on unmount and navigation
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    const handlePopState = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      saveScrollPosition();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [saveScrollPosition, restoreScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  };
}

/**
 * Bidirectional Infinite Scroll Hook
 * 
 * Provides bi-directional infinite scrolling:
 * - Load more items when scrolling down
 * - Load previous items when scrolling up
 * - Prefetch next page before reaching bottom
 * - Scroll position preservation
 * - Loading states for both directions
 */
export function useBidirectionalScroll<T>({
  items,
  itemsPerPage = 20,
  enabled = true,
  threshold = 200,
  prefetchPages = 1,
  onLoadMore,
}: {
  items: T[];
  itemsPerPage?: number;
  enabled?: boolean;
  threshold?: number;
  prefetchPages?: number;
  onLoadMore?: (direction: 'forward' | 'backward') => Promise<T[]>;
}) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [isLoadingForward, setIsLoadingForward] = useState(false);
  const [isLoadingBackward, setIsLoadingBackward] = useState(false);
  const [hasMoreForward, setHasMoreForward] = useState(true);
  const [hasMoreBackward, setHasMoreBackward] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  
  const observerTargetBottom = useRef<HTMLDivElement>(null);
  const observerTargetTop = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    if (!enabled) {
      setDisplayedItems(items);
      return;
    }

    const initialItems = items.slice(0, itemsPerPage);
    setDisplayedItems(initialItems);
    setHasMoreForward(items.length > itemsPerPage);
    setHasMoreBackward(false);
    setStartIndex(0);
  }, [items, itemsPerPage, enabled]);

  // Load more forward
  const loadMoreForward = useCallback(async () => {
    if (!enabled || isLoadingForward || !hasMoreForward) return;

    setIsLoadingForward(true);

    try {
      if (onLoadMore) {
        const newItems = await onLoadMore('forward');
        setDisplayedItems((prev) => [...prev, ...newItems]);
        setHasMoreForward(newItems.length === itemsPerPage);
      } else {
        const currentLength = displayedItems.length;
        const nextItems = items.slice(currentLength, currentLength + itemsPerPage);
        setDisplayedItems((prev) => [...prev, ...nextItems]);
        setHasMoreForward(currentLength + nextItems.length < items.length);
      }
    } finally {
      setIsLoadingForward(false);
    }
  }, [enabled, isLoadingForward, hasMoreForward, displayedItems.length, items, itemsPerPage, onLoadMore]);

  // Load more backward
  const loadMoreBackward = useCallback(async () => {
    if (!enabled || isLoadingBackward || !hasMoreBackward) return;

    setIsLoadingBackward(true);

    try {
      if (onLoadMore) {
        const newItems = await onLoadMore('backward');
        setDisplayedItems((prev) => [...newItems, ...prev]);
        setStartIndex((prev) => prev - newItems.length);
        setHasMoreBackward(newItems.length === itemsPerPage);
      } else {
        const newStartIndex = Math.max(0, startIndex - itemsPerPage);
        const previousItems = items.slice(newStartIndex, startIndex);
        setDisplayedItems((prev) => [...previousItems, ...prev]);
        setStartIndex(newStartIndex);
        setHasMoreBackward(newStartIndex > 0);
      }
    } finally {
      setIsLoadingBackward(false);
    }
  }, [enabled, isLoadingBackward, hasMoreBackward, startIndex, items, itemsPerPage, onLoadMore]);

  // Intersection Observer for bottom
  useEffect(() => {
    if (!enabled || !observerTargetBottom.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreForward && !isLoadingForward) {
          loadMoreForward();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(observerTargetBottom.current);
    return () => observer.disconnect();
  }, [enabled, hasMoreForward, isLoadingForward, loadMoreForward, threshold]);

  // Intersection Observer for top
  useEffect(() => {
    if (!enabled || !observerTargetTop.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreBackward && !isLoadingBackward) {
          loadMoreBackward();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(observerTargetTop.current);
    return () => observer.disconnect();
  }, [enabled, hasMoreBackward, isLoadingBackward, loadMoreBackward, threshold]);

  return {
    displayedItems: enabled ? displayedItems : items,
    isLoadingForward,
    isLoadingBackward,
    hasMoreForward: enabled ? hasMoreForward : false,
    hasMoreBackward: enabled ? hasMoreBackward : false,
    observerTargetBottom,
    observerTargetTop,
    loadMoreForward,
    loadMoreBackward,
  };
}


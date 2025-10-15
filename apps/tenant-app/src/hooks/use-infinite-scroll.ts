'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  itemsPerPage?: number;
  enabled?: boolean;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
}

/**
 * Infinite Scroll Hook
 * 
 * Provides infinite scroll/pagination functionality:
 * - Loads items progressively as user scrolls
 * - Uses Intersection Observer API for efficient scroll detection
 * - Customizable items per page and trigger threshold
 * - Loading state management
 * - Works on both mobile and desktop
 */
export function useInfiniteScroll<T>({
  items,
  itemsPerPage = 20,
  enabled = true,
  threshold = 200,
}: UseInfiniteScrollOptions<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Initialize displayed items
  useEffect(() => {
    const initialItems = items.slice(0, itemsPerPage);
    setDisplayedItems(initialItems);
    setCurrentPage(1);
    setHasMore(items.length > itemsPerPage);
  }, [items, itemsPerPage]);

  // Load more items
  const loadMore = useCallback(() => {
    if (!enabled || loadingRef.current || !hasMore) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    
    // Simulate async loading with setTimeout
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newItems = items.slice(startIndex, endIndex);
      
      if (newItems.length > 0) {
        setDisplayedItems((prev) => [...prev, ...newItems]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < items.length);
      } else {
        setHasMore(false);
      }
      
      setIsLoading(false);
      loadingRef.current = false;
    }, 300); // Small delay to prevent rapid loading
  }, [enabled, hasMore, currentPage, itemsPerPage, items]);

  // Set up Intersection Observer
  useEffect(() => {
    if (!enabled || !observerTarget.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );
    
    observer.observe(observerTarget.current);
    
    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, loadMore, threshold]);

  // CODE QUALITY: Reset when items change (fixed dependency array)
  useEffect(() => {
    setCurrentPage(1);
    setDisplayedItems(items.slice(0, itemsPerPage));
    setHasMore(items.length > itemsPerPage);
    loadingRef.current = false;
  }, [items, itemsPerPage]);

  return {
    displayedItems,
    isLoading,
    hasMore,
    observerTarget,
    loadMore,
  };
}


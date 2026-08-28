'use client';

import { type RefObject, useEffect, useRef } from 'react';

interface UseInfiniteScrollParams {
  /** Whether there are more pages to load. */
  hasMore: boolean;
  /** Whether a page is currently being fetched. Prevents duplicate triggers. */
  isLoading: boolean;
  /** Called when the sentinel scrolls into view and more data can be loaded. */
  onLoadMore: () => void;
  /** Scroll container used as the IntersectionObserver root (falls back to the viewport). */
  rootRef: RefObject<HTMLElement | null>;
  /** Pre-fetch margin so the next page loads slightly before the sentinel is visible. */
  rootMargin?: string;
  /** Disable observation entirely (e.g. while the dropdown is closed). */
  enabled?: boolean;
}

/**
 * Observes a sentinel element and invokes `onLoadMore` when it enters the
 * scroll container. Returns the ref to attach to the sentinel element.
 */
export function useInfiniteScroll<TSentinel extends HTMLElement = HTMLDivElement>({
  hasMore,
  isLoading,
  onLoadMore,
  rootRef,
  rootMargin = '96px',
  enabled = true,
}: UseInfiniteScrollParams): RefObject<TSentinel | null> {
  const sentinelRef = useRef<TSentinel | null>(null);

  // Keep the latest callback without re-creating the observer on every render.
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    if (!enabled || !hasMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !isLoading) {
          onLoadMoreRef.current();
        }
      },
      { root: rootRef.current, rootMargin },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, hasMore, isLoading, rootRef, rootMargin]);

  return sentinelRef;
}

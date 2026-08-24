'use client';

import { type UIEventHandler, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: () => Promise<unknown> | void;
  readonly threshold?: number;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 5,
}: UseInfiniteScrollOptions): UIEventHandler<HTMLElement> {
  return useCallback(
    (event) => {
      const element = event.currentTarget;
      const reachedBottom =
        element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
      if (reachedBottom && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, threshold],
  );
}

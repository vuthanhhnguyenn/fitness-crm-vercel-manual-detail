'use client';

import { useEffect, useRef } from 'react';

import { toast } from 'sonner';

/**
 * Shows a toast once per error episode for a list query.
 *
 * `DataTable` owns the loading and empty states, so a failed list query must NOT
 * swap the whole region for an error boundary — that would unmount the search box
 * and filters and leave the user with no way out. A toast keeps the toolbar usable.
 */
export function useQueryErrorToast(isError: boolean, message: string): void {
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (!isError) {
      hasNotifiedRef.current = false;
      return;
    }

    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    toast.error(message);
  }, [isError, message]);
}

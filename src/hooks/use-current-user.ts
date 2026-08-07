'use client';

import { useQuery } from '@tanstack/react-query';

import { getAuthMeOptions } from '@/lib/api/@tanstack/react-query.gen';

/**
 * Fetches the authenticated user.
 * Must be used inside <AuthUserProvider> after the initial render.
 */
export function useCurrentUser() {
  return useQuery({
    ...getAuthMeOptions(),
    staleTime: Infinity, // user profile only changes on explicit mutation → invalidate there
    retry: false,
  });
}

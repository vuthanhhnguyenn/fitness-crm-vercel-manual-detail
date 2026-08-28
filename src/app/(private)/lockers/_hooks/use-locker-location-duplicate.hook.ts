'use client';

import { useQuery } from '@tanstack/react-query';

import { getCrmLockersUsedLocationSymbolsOptions } from '@/lib/api/@tanstack/react-query.gen';

type UseLockerLocationDuplicateArgs = {
  storeId?: string;
  locationSymbol?: string;
  /** On edit, the locker's own symbol must not count as a conflict with itself. */
  excludeLockerId?: string;
};

/**
 * E-01 FR-001: 「同一店舗内でロケーション記号の重複を禁止する」.
 *
 * Shared by the form section (inline error) and the create/edit pages (disable save), so the
 * known-duplicate symbol never reaches the API. Both callers hit the same query key, so React
 * Query serves the second one from cache instead of issuing a duplicate request.
 */
export function useLockerLocationDuplicate({
  storeId,
  locationSymbol,
  excludeLockerId,
}: UseLockerLocationDuplicateArgs): boolean {
  const { data } = useQuery({
    ...getCrmLockersUsedLocationSymbolsOptions({
      query: {
        store_id: storeId ?? '',
        ...(excludeLockerId ? { exclude_locker_id: excludeLockerId } : {}),
      },
    }),
    enabled: Boolean(storeId),
  });

  if (!locationSymbol) return false;

  return (data?.location_symbols ?? []).includes(locationSymbol);
}

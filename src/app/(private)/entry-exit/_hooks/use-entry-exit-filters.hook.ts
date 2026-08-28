import { ALL_STORES } from '@/contexts/current-store.context';
import { formatISODateLocal } from '@/utils/date.util';
import { parseAsString, useQueryStates } from 'nuqs';

/**
 * FR-B01-09/10: URL-synced date scope for the activity tables and hourly chart.
 * `storeOverride` is a page-local narrowing filter on top of the header's global store scope
 * (`useCurrentStore()`) — see `entry-exit-header-controls.tsx` for when it applies.
 */
export function useEntryExitFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      date: parseAsString.withDefault(formatISODateLocal(new Date())),
      store_id: parseAsString.withDefault(ALL_STORES),
    },
    { history: 'push', shallow: false },
  );

  return {
    date: filters.date,
    storeOverride: filters.store_id,
    setDate: (date: string) => setFilters({ date }),
    setStoreOverride: (storeId: string) =>
      setFilters({ store_id: storeId === ALL_STORES ? null : storeId }),
  };
}

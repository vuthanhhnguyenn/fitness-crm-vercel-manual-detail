import { useMemo } from 'react';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { format, subDays } from 'date-fns';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmEntryExitLogsHistoryData } from '@/lib/api/types.gen';

const HISTORY_DEFAULT_RANGE_DAYS = 30;

type AuthMethod = NonNullable<NonNullable<GetCrmEntryExitLogsHistoryData['query']>['auth_method']>;
type HistoryResult = NonNullable<NonNullable<GetCrmEntryExitLogsHistoryData['query']>['result']>;
type SortBy = NonNullable<NonNullable<GetCrmEntryExitLogsHistoryData['query']>['sort_by']>;
type SortOrder = 'asc' | 'desc';

export type EntryExitHistoryFiltersState = {
  page: number;
  limit: number;
  search: string;
  date_from: string;
  date_to: string;
  store_id: string | null;
  auth_method: AuthMethod | null;
  result: HistoryResult | null;
  sort_by: SortBy;
  sort_order: SortOrder;
};

/**
 * `nuqs` URL-state filters for the entry-exit history screen, following the
 * same shape as every other filterable list screen in this app
 * (`use-banners-filters.ts`, `use-locker-pending-slots-filters.ts`).
 */
export function useEntryExitHistoryFilters() {
  // Reflect the header store scope in the fetch/export conditions, mirroring
  // entry-exit-section.tsx: a specific header store wins; when the header is
  // "全店舗" the page-local store filter (if any) takes over.
  const { currentStoreId } = useCurrentStore();

  const defaultDateTo = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const defaultDateFrom = useMemo(
    () => format(subDays(new Date(), HISTORY_DEFAULT_RANGE_DAYS - 1), 'yyyy-MM-dd'),
    [],
  );

  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(50),
      search: parseAsString.withDefault(''),
      date_from: parseAsString.withDefault(defaultDateFrom),
      date_to: parseAsString.withDefault(defaultDateTo),
      store_id: parseAsString,
      auth_method: parseAsStringEnum<AuthMethod>(['qr', 'nfc']),
      result: parseAsStringEnum<HistoryResult>(['success', 'denied']),
      sort_by: parseAsStringEnum<SortBy>([
        'name',
        'visit_date',
        'entry_time',
        'exit_time',
        'contract_name',
      ]).withDefault('visit_date'),
      sort_order: parseAsStringEnum<SortOrder>(['asc', 'desc']).withDefault('desc'),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const updateFilter = <K extends keyof EntryExitHistoryFiltersState>(
    key: K,
    value: EntryExitHistoryFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: 50,
      search: null,
      date_from: defaultDateFrom,
      date_to: defaultDateTo,
      store_id: null,
      auth_method: null,
      result: null,
      sort_by: 'visit_date',
      sort_order: 'desc',
    });
  };

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.date_from !== defaultDateFrom ||
    filters.date_to !== defaultDateTo ||
    filters.store_id !== null ||
    filters.auth_method !== null ||
    filters.result !== null;

  const activeDetailFilterCount = [
    filters.date_from !== defaultDateFrom || filters.date_to !== defaultDateTo,
    filters.store_id !== null,
    filters.auth_method !== null,
    filters.result !== null,
  ].filter(Boolean).length;

  const effectiveStoreId =
    currentStoreId === ALL_STORES ? (filters.store_id ?? undefined) : currentStoreId;

  const queryParams: NonNullable<GetCrmEntryExitLogsHistoryData['query']> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    store_id: effectiveStoreId,
    auth_method: filters.auth_method ?? undefined,
    result: filters.result ?? undefined,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  };

  const exportQueryParams: Omit<typeof queryParams, 'page' | 'limit'> = {
    search: queryParams.search,
    date_from: queryParams.date_from,
    date_to: queryParams.date_to,
    store_id: queryParams.store_id,
    auth_method: queryParams.auth_method,
    result: queryParams.result,
    sort_by: queryParams.sort_by,
    sort_order: queryParams.sort_order,
  };

  return {
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeDetailFilterCount,
    queryParams,
    exportQueryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}

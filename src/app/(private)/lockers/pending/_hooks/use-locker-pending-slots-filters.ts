import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import {
  type GetCrmLockersPendingSlotsData,
  LockerPendingLocation,
  type LockerPendingLocation as LockerPendingLocationValue,
  type PostCrmLockersPendingSlotsExportData,
} from '@/lib/api/types.gen';

import { LOCKER_LIST_DEFAULT_PAGE_SIZE } from '../../_constants/constants';

type LockerPendingSortBy = NonNullable<GetCrmLockersPendingSlotsData['query']>['sort_by'];

export function useLockerPendingSlotsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      locker_pending_page: parseAsInteger.withDefault(1),
      locker_pending_limit: parseAsInteger.withDefault(LOCKER_LIST_DEFAULT_PAGE_SIZE),
      locker_pending_search: parseAsString.withDefault(''),
      locker_pending_store_id: parseAsString,
      locker_pending_location: parseAsStringEnum<LockerPendingLocationValue>(
        Object.values(LockerPendingLocation),
      ),
      locker_pending_cancel_from: parseAsString.withDefault(''),
      locker_pending_cancel_to: parseAsString.withDefault(''),
      locker_pending_sort_by: parseAsString.withDefault('pending_since'),
      locker_pending_sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault(
        'asc',
      ),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(
    filters.locker_pending_search,
    (value) => setFilters({ locker_pending_search: value || null, locker_pending_page: 1 }),
  );

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      locker_pending_page: 1,
      locker_pending_limit: LOCKER_LIST_DEFAULT_PAGE_SIZE,
      locker_pending_search: null,
      locker_pending_store_id: null,
      locker_pending_location: null,
      locker_pending_cancel_from: null,
      locker_pending_cancel_to: null,
      locker_pending_sort_by: 'pending_since',
      locker_pending_sort_order: 'asc',
    });
  };

  const queryParams: NonNullable<GetCrmLockersPendingSlotsData['query']> = {
    page: filters.locker_pending_page,
    limit: filters.locker_pending_limit,
    search: filters.locker_pending_search || undefined,
    store_id: filters.locker_pending_store_id || undefined,
    locker_location: filters.locker_pending_location || undefined,
    cancel_date_from: filters.locker_pending_cancel_from || undefined,
    cancel_date_to: filters.locker_pending_cancel_to || undefined,
    sort_by: filters.locker_pending_sort_by as LockerPendingSortBy,
    sort_order: filters.locker_pending_sort_order,
  };

  const exportQueryParams: NonNullable<PostCrmLockersPendingSlotsExportData['body']> = {
    search: filters.locker_pending_search || undefined,
    store_id: filters.locker_pending_store_id || undefined,
    locker_location: filters.locker_pending_location || undefined,
    cancel_date_from: filters.locker_pending_cancel_from || undefined,
    cancel_date_to: filters.locker_pending_cancel_to || undefined,
    sort_by: filters.locker_pending_sort_by as LockerPendingSortBy,
    sort_order: filters.locker_pending_sort_order,
  };

  return {
    filters,
    queryParams,
    exportQueryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    currentPage: filters.locker_pending_page,
    setCurrentPage: (page: number) => setFilters({ locker_pending_page: page }),
    pageSize: filters.locker_pending_limit,
    setPageSize: (limit: number) =>
      setFilters({ locker_pending_limit: limit, locker_pending_page: 1 }),
    hasActiveFilters:
      filters.locker_pending_store_id !== null ||
      filters.locker_pending_location !== null ||
      filters.locker_pending_cancel_from.length > 0 ||
      filters.locker_pending_cancel_to.length > 0 ||
      filters.locker_pending_search.length > 0,
    activeFilterCount: [
      filters.locker_pending_store_id !== null,
      filters.locker_pending_location !== null,
      filters.locker_pending_cancel_from.length > 0,
      filters.locker_pending_cancel_to.length > 0,
    ].filter(Boolean).length,
  };
}

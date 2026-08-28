import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import {
  type GetCrmLockersData,
  LockerShape,
  type LockerShape as LockerShapeValue,
  type PostCrmLockersExportData,
} from '@/lib/api/types.gen';

import { LOCKER_LIST_DEFAULT_PAGE_SIZE } from '../_constants/constants';

type LockerSortBy = NonNullable<GetCrmLockersData['query']>['sort_by'];

export function useLockersFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      lockers_page: parseAsInteger.withDefault(1),
      lockers_limit: parseAsInteger.withDefault(LOCKER_LIST_DEFAULT_PAGE_SIZE),
      lockers_search: parseAsString.withDefault(''),
      lockers_shape: parseAsStringEnum<LockerShapeValue>(Object.values(LockerShape)),
      lockers_sort_by: parseAsString.withDefault('locker_id'),
      lockers_sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.lockers_search, (value) =>
    setFilters({ lockers_search: value || null, lockers_page: 1 }),
  );

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      lockers_page: 1,
      lockers_limit: LOCKER_LIST_DEFAULT_PAGE_SIZE,
      lockers_search: null,
      lockers_shape: null,
      lockers_sort_by: 'locker_id',
      lockers_sort_order: 'asc',
    });
  };

  const queryParams: NonNullable<GetCrmLockersData['query']> = {
    page: filters.lockers_page,
    limit: filters.lockers_limit,
    search: filters.lockers_search || undefined,
    shape: filters.lockers_shape || undefined,
    sort_by: filters.lockers_sort_by as LockerSortBy,
    sort_order: filters.lockers_sort_order,
  };

  const exportQueryParams: NonNullable<PostCrmLockersExportData['body']> = {
    search: filters.lockers_search || undefined,
    shape: filters.lockers_shape || undefined,
    sort_by: filters.lockers_sort_by as LockerSortBy,
    sort_order: filters.lockers_sort_order,
  };

  return {
    filters,
    queryParams,
    exportQueryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    currentPage: filters.lockers_page,
    setCurrentPage: (page: number) => setFilters({ lockers_page: page }),
    pageSize: filters.lockers_limit,
    setPageSize: (limit: number) => setFilters({ lockers_limit: limit, lockers_page: 1 }),
    hasActiveFilters: filters.lockers_shape !== null || filters.lockers_search.length > 0,
    activeFilterCount: [filters.lockers_shape !== null].filter(Boolean).length,
  };
}

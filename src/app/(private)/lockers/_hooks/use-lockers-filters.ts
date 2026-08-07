import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import {
  type GetCrmLockersData,
  LockerShape,
  type LockerShape as LockerShapeValue,
  type PostCrmLockersExportData,
} from '@/lib/api/types.gen';

type LockerSortBy = NonNullable<GetCrmLockersData['query']>['sort_by'];

export function useLockersFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      lockers_page: parseAsInteger.withDefault(1),
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

  const [searchInput, setSearchInput] = useState(() => filters.lockers_search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.lockers_search) {
        setFilters({ lockers_search: searchInput || null, lockers_page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.lockers_search, searchInput, setFilters]);

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      lockers_page: 1,
      lockers_search: null,
      lockers_shape: null,
      lockers_sort_by: 'locker_id',
      lockers_sort_order: 'asc',
    });
  };

  const queryParams: NonNullable<GetCrmLockersData['query']> = {
    page: filters.lockers_page,
    limit: PAGE_SIZE,
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
    pageSize: PAGE_SIZE,
    hasActiveFilters: filters.lockers_shape !== null || filters.lockers_search.length > 0,
    activeFilterCount: [filters.lockers_shape !== null].filter(Boolean).length,
  };
}

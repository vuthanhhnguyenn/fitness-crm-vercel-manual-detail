import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmStoresData } from '@/lib/api/types.gen';
import { StoreArea, StoreListBrand, StoreListStatus } from '@/lib/api/types.gen';

export type StoresFiltersState = {
  page: number;
  search: string;
  brand: StoreListBrand | null;
  area: StoreArea | null;
  status: StoreListStatus | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

export function useStoresFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(''),
      brand: parseAsStringEnum<StoreListBrand>(Object.values(StoreListBrand)),
      area: parseAsStringEnum<StoreArea>(Object.values(StoreArea)),
      status: parseAsStringEnum<StoreListStatus>(Object.values(StoreListStatus)),
      sort_by: parseAsString.withDefault('store_id'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  // Initialized from URL so the input reflects any pre-existing search param
  const [searchInput, setSearchInput] = useState(() => filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const updateFilter = <K extends keyof StoresFiltersState>(
    key: K,
    value: StoresFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      brand: null,
      area: null,
      status: null,
      sort_by: 'store_id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters: boolean =
    filters.brand !== null ||
    filters.area !== null ||
    filters.status !== null ||
    filters.search.length > 0;

  const queryParams: NonNullable<GetCrmStoresData['query']> = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    brand: filters.brand || undefined,
    area: filters.area || undefined,
    status: filters.status || undefined,
    sort_by: filters.sort_by as NonNullable<GetCrmStoresData['query']>['sort_by'],
    sort_order: filters.sort_order,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: PAGE_SIZE,
  };
}

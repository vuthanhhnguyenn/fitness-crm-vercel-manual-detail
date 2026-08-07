import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmOptionsData } from '@/lib/api/types.gen';
import { OptionStatus, OptionType, StoreListBrand } from '@/lib/api/types.gen';

export type OptionsFiltersState = {
  page: number;
  limit: number;
  search: string;
  brand: StoreListBrand | null;
  option_type: OptionType | null;
  status: OptionStatus | null;
  store_id: string | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

export function useOptionsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      brand: parseAsStringEnum<StoreListBrand>(Object.values(StoreListBrand)),
      option_type: parseAsStringEnum<OptionType>(Object.values(OptionType)),
      status: parseAsStringEnum<OptionStatus>(Object.values(OptionStatus)),
      store_id: parseAsString,
      sort_by: parseAsString.withDefault('id'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const updateFilter = <K extends keyof OptionsFiltersState>(
    key: K,
    value: OptionsFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      search: null,
      brand: null,
      option_type: null,
      status: null,
      store_id: null,
      sort_by: 'id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters: boolean =
    filters.brand !== null ||
    filters.option_type !== null ||
    filters.status !== null ||
    filters.store_id !== null ||
    filters.search.length > 0;

  const queryParams: NonNullable<GetCrmOptionsData['query']> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    brand: filters.brand || undefined,
    option_type: filters.option_type || undefined,
    status: filters.status || undefined,
    store_id: filters.store_id || undefined,
    sort_by: filters.sort_by as NonNullable<GetCrmOptionsData['query']>['sort_by'],
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
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}

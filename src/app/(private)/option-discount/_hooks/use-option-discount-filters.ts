import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmOptionDiscountsData } from '@/lib/api/types.gen';
import { OptionDiscountStatus, OptionDiscountType } from '@/lib/api/types.gen';

export type OptionDiscountFiltersState = {
  page: number;
  search: string;
  discount_type: OptionDiscountType | null;
  status: OptionDiscountStatus | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

export function useOptionDiscountFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(''),
      discount_type: parseAsStringEnum<OptionDiscountType>(Object.values(OptionDiscountType)),
      status: parseAsStringEnum<OptionDiscountStatus>(Object.values(OptionDiscountStatus)),
      sort_by: parseAsString.withDefault('id'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const [searchInput, setSearchInput] = useState(() => filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const updateFilter = <K extends keyof OptionDiscountFiltersState>(
    key: K,
    value: OptionDiscountFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      discount_type: null,
      status: null,
      sort_by: 'id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters =
    filters.discount_type !== null || filters.status !== null || filters.search.length > 0;

  const queryParams: NonNullable<GetCrmOptionDiscountsData['query']> = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    discount_type: filters.discount_type || undefined,
    status: filters.status || undefined,
    sort_by: filters.sort_by as NonNullable<GetCrmOptionDiscountsData['query']>['sort_by'],
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

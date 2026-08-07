'use client';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function useBrandsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
    },
    {
      history: 'push',
      shallow: true,
    },
  );

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      search: null,
    });
  };

  return {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters: filters.search.length > 0,
    queryParams: {
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
    },
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}

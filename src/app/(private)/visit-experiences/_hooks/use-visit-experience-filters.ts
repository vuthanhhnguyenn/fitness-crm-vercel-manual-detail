'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type {
  GetVisitExperiencesQuery,
  VisitExperienceDateRangeFilter,
  VisitExperienceStatus,
} from '@/types/api/visit-experience.type';

export function useVisitExperienceFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      status: parseAsString.withDefault(''),
      brand_name: parseAsString.withDefault(''),
      store_name: parseAsString.withDefault(''),
      bl_match: parseAsString.withDefault(''),
      date_range: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(50),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const updateFilter = (
    key: 'status' | 'brand_name' | 'store_name' | 'bl_match' | 'date_range',
    value: string,
  ) => {
    void setFilters({ [key]: value || null, page: 1 });
  };

  const clearFilters = () => {
    setSearchInput('');
    void setFilters({
      search: null,
      status: null,
      brand_name: null,
      store_name: null,
      bl_match: null,
      date_range: null,
      page: 1,
    });
  };

  const { search, status, brand_name, store_name, bl_match, date_range } = filters;

  const activeFilterCount = [status, brand_name, store_name, bl_match, date_range].filter(
    Boolean,
  ).length;
  const hasActiveFilters = activeFilterCount > 0 || search !== '';

  const queryParams: GetVisitExperiencesQuery = {
    page: filters.page,
    limit: filters.limit as 25 | 50 | 100 | 200,
    search: search || undefined,
    status: (status as VisitExperienceStatus) || undefined,
    brand_name: brand_name || undefined,
    store_name: store_name || undefined,
    bl_match: bl_match ? true : undefined,
    date_range: (date_range as VisitExperienceDateRangeFilter) || undefined,
  };

  return {
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => void setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => void setFilters({ limit: nextLimit, page: 1 }),
  };
}

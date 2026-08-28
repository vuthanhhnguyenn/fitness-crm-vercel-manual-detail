import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmRoutinesData } from '@/lib/api/types.gen';

import {
  ROUTINE_DEFAULT_PAGE_SIZE,
  ROUTINE_PAGE_SIZE_OPTIONS,
} from '../_constants/routine.constants';

type RoutineQuery = NonNullable<GetCrmRoutinesData['query']>;

const PUBLISH_STATUS_VALUES = ['published', 'unpublished'] satisfies Array<
  NonNullable<RoutineQuery['publishStatus']>
>;

const SORT_BY_VALUES = ['name', 'exerciseCount', 'publishStatus', 'updatedAt'] satisfies Array<
  NonNullable<RoutineQuery['sortBy']>
>;

export function useRoutineFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      rt_keyword: parseAsString.withDefault(''),
      rt_category: parseAsString,
      rt_status: parseAsStringEnum(PUBLISH_STATUS_VALUES),
      rt_sort_by: parseAsStringEnum(SORT_BY_VALUES),
      rt_sort_order: parseAsStringEnum(['asc', 'desc']),
      rt_page: parseAsInteger.withDefault(1),
      rt_page_size: parseAsInteger.withDefault(ROUTINE_DEFAULT_PAGE_SIZE),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.rt_keyword, (value) =>
    setFilters({ rt_keyword: value || null, rt_page: 1 }),
  );

  const normalizedPageSize = ROUTINE_PAGE_SIZE_OPTIONS.includes(
    filters.rt_page_size as (typeof ROUTINE_PAGE_SIZE_OPTIONS)[number],
  )
    ? filters.rt_page_size
    : ROUTINE_DEFAULT_PAGE_SIZE;

  const queryParams: RoutineQuery = {
    search: filters.rt_keyword || undefined,
    categoryId: filters.rt_category || undefined,
    publishStatus: filters.rt_status || undefined,
    sortBy: filters.rt_sort_by || undefined,
    sortOrder:
      filters.rt_sort_order === 'asc' || filters.rt_sort_order === 'desc'
        ? filters.rt_sort_order
        : undefined,
    page: filters.rt_page,
    limit: normalizedPageSize,
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      rt_keyword: null,
      rt_category: null,
      rt_status: null,
      rt_sort_by: null,
      rt_sort_order: null,
      rt_page: 1,
      rt_page_size: ROUTINE_DEFAULT_PAGE_SIZE,
    });
  };

  const activeFilterCount = [filters.rt_category != null, filters.rt_status != null].filter(
    Boolean,
  ).length;

  return {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    currentPage: filters.rt_page,
    setCurrentPage: (page: number) => setFilters({ rt_page: page }),
    setPageSize: (pageSize: number) => setFilters({ rt_page_size: pageSize, rt_page: 1 }),
    pageSize: normalizedPageSize,
    hasActiveFilters:
      filters.rt_keyword.length > 0 || filters.rt_category != null || filters.rt_status != null,
    activeFilterCount,
  };
}

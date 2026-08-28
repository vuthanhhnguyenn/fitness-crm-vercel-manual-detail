import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmExercisesData } from '@/lib/api/types.gen';

import { EXERCISE_SORT_FIELDS } from '../_constants/constants';

type ExercisesQuery = NonNullable<GetCrmExercisesData['query']>;

export function useExercisesFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      categoryId: parseAsString,
      primaryMuscleId: parseAsString,
      toolId: parseAsString,
      level: parseAsStringEnum(['beginner', 'expert']),
      publishStatus: parseAsStringEnum(['public', 'private']),
      sortBy: parseAsStringEnum([...EXERCISE_SORT_FIELDS]).withDefault('updatedAt'),
      sortOrder: parseAsStringEnum(['asc', 'desc']).withDefault('desc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      search: null,
      categoryId: null,
      primaryMuscleId: null,
      toolId: null,
      level: null,
      publishStatus: null,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  const queryParams: ExercisesQuery = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
    primaryMuscleId: filters.primaryMuscleId || undefined,
    toolId: filters.toolId || undefined,
    level: (filters.level as ExercisesQuery['level']) || undefined,
    publishStatus: (filters.publishStatus as ExercisesQuery['publishStatus']) || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.categoryId !== null ||
    filters.primaryMuscleId !== null ||
    filters.toolId !== null ||
    filters.level !== null ||
    filters.publishStatus !== null;

  return {
    filters,
    setFilters,
    queryParams,
    hasActiveFilters,
    searchInput,
    setSearchInput,
    clearFilters,
    currentPage: filters.page,
    setCurrentPage: (page: number) => setFilters({ page }),
    pageSize: filters.limit,
    setPageSize: (limit: number) => setFilters({ limit, page: 1 }),
  };
}

import { useEffect, useState } from 'react';

import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';

import type {
  GetCrmLessonContentsData,
  GetCrmPersonalPlansData,
  LessonBrand,
} from '@/lib/api/types.gen';

import { LESSONS_PAGE_SIZE, type LessonTab } from '../_constants/constants';

const TAB_VALUES: LessonTab[] = ['studio', 'personal', 'bodycare'];
const BRAND_VALUES: LessonBrand[] = ['joyfit', 'fit365'];
const STATUS_VALUES: Array<'active' | 'inactive'> = ['active', 'inactive'];

const DEFAULT_SORT_BY = 'id';
const DEFAULT_SORT_ORDER: 'asc' | 'desc' = 'asc';

type LessonContentsQuery = NonNullable<GetCrmLessonContentsData['query']>;
type PersonalPlansQuery = NonNullable<GetCrmPersonalPlansData['query']>;

export function useLessonsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      tab: parseAsStringEnum<LessonTab>(TAB_VALUES).withDefault('studio'),
      search: parseAsString.withDefault(''),
      lesson_category: parseAsArrayOf(parseAsString).withDefault([]),
      category: parseAsArrayOf(parseAsString).withDefault([]),
      brand: parseAsArrayOf(parseAsStringEnum<LessonBrand>(BRAND_VALUES)).withDefault([]),
      status: parseAsArrayOf(parseAsStringEnum<'active' | 'inactive'>(STATUS_VALUES)).withDefault(
        [],
      ),
      include_deleted: parseAsBoolean.withDefault(false),
      store_id: parseAsString.withDefault(''),
      sort_by: parseAsString.withDefault(DEFAULT_SORT_BY),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault(
        DEFAULT_SORT_ORDER,
      ),
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  // Local search input mirrors the URL param and is debounced into it.
  const [searchInput, setSearchInput] = useState(() => filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const resetPayload = {
    search: null,
    lesson_category: null,
    category: null,
    brand: null,
    status: null,
    include_deleted: null,
    store_id: null,
    sort_by: DEFAULT_SORT_BY,
    sort_order: DEFAULT_SORT_ORDER,
    page: 1,
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ ...resetPayload });
  };

  // Switching tabs resets every filter so the studio/personal/bodycare tabs
  // never share filter state (their category axes are not interchangeable).
  const changeTab = (tab: LessonTab) => {
    setSearchInput('');
    setFilters({ tab, ...resetPayload });
  };

  const hasActiveFilters: boolean =
    filters.search.length > 0 ||
    filters.lesson_category.length > 0 ||
    filters.category.length > 0 ||
    filters.brand.length > 0 ||
    filters.status.length > 0 ||
    filters.include_deleted ||
    filters.store_id.length > 0;

  const setCurrentPage = (nextPage: number) => setFilters({ page: nextPage });

  const setSort = (sort_by: string, sort_order: 'asc' | 'desc') =>
    setFilters({ sort_by, sort_order });

  const lessonContentsQuery = (kind: 'studio' | 'bodycare'): LessonContentsQuery => ({
    kind,
    page: filters.page,
    limit: LESSONS_PAGE_SIZE,
    search: filters.search || undefined,
    lesson_category: filters.lesson_category.length > 0 ? filters.lesson_category : undefined,
    category: filters.category.length > 0 ? filters.category : undefined,
    brand: filters.brand.length > 0 ? filters.brand : undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    include_deleted: filters.include_deleted || undefined,
    store_id: filters.store_id || undefined,
    sort_by: filters.sort_by as LessonContentsQuery['sort_by'],
    sort_order: filters.sort_order,
  });

  const personalPlansQuery = (): PersonalPlansQuery => ({
    page: filters.page,
    limit: LESSONS_PAGE_SIZE,
    search: filters.search || undefined,
    category: filters.category.length > 0 ? filters.category : undefined,
    brand: filters.brand.length > 0 ? filters.brand : undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    include_deleted: filters.include_deleted || undefined,
    store_id: filters.store_id || undefined,
    sort_by: filters.sort_by as PersonalPlansQuery['sort_by'],
    sort_order: filters.sort_order,
  });

  return {
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    clearFilters,
    changeTab,
    hasActiveFilters,
    currentPage: filters.page,
    setCurrentPage,
    pageSize: LESSONS_PAGE_SIZE,
    setSort,
    lessonContentsQuery,
    personalPlansQuery,
  };
}

export type UseLessonsFiltersReturn = ReturnType<typeof useLessonsFilters>;

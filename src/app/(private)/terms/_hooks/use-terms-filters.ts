import { useCallback, useEffect, useRef, useState } from 'react';

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebounce } from '@/hooks/use-debounce.hook';

import {
  BRAND_OPTIONS,
  DEFAULT_TERMS_ORDER,
  DEFAULT_TERMS_PAGE_SIZE,
  DEFAULT_TERMS_SORT,
  INCLUDE_DELETED_VALUES,
  TERMS_ORDER_OPTIONS,
  TERMS_SORT_OPTIONS,
  TERMS_STATUS_OPTIONS,
  TERMS_TYPE_OPTIONS,
} from '../_constants/constants';
import {
  type TermsFiltersState,
  type TermsListApiQuery,
  TermsListApiQuerySchema,
} from '../_schemas/terms-list-filters.schema';

export function useTermsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(DEFAULT_TERMS_PAGE_SIZE),
      sort: parseAsStringEnum<(typeof TERMS_SORT_OPTIONS)[number]>([
        ...TERMS_SORT_OPTIONS,
      ]).withDefault(DEFAULT_TERMS_SORT),
      order: parseAsStringEnum<(typeof TERMS_ORDER_OPTIONS)[number]>([
        ...TERMS_ORDER_OPTIONS,
      ]).withDefault(DEFAULT_TERMS_ORDER),
      search: parseAsString.withDefault(''),
      status: parseAsStringEnum<(typeof TERMS_STATUS_OPTIONS)[number]>([...TERMS_STATUS_OPTIONS]),
      termsType: parseAsStringEnum<(typeof TERMS_TYPE_OPTIONS)[number]>([...TERMS_TYPE_OPTIONS]),
      brandEnum: parseAsStringEnum<(typeof BRAND_OPTIONS)[number]>([...BRAND_OPTIONS]),
      includeDeleted: parseAsStringEnum<(typeof INCLUDE_DELETED_VALUES)[number]>([
        ...INCLUDE_DELETED_VALUES,
      ]).withDefault('false'),
    },
    {
      history: 'push',
      shallow: true,
    },
  );

  const [searchInput, setSearchInputState] = useState(() => filters.search);
  const debouncedSearchInput = useDebounce(searchInput, 500);
  const lastSyncedSearchRef = useRef(filters.search);
  const isUserSearchChangeRef = useRef(false);

  const setSearchInput = useCallback((value: string) => {
    isUserSearchChangeRef.current = true;
    setSearchInputState(value);
  }, []);

  useEffect(() => {
    if (filters.search !== lastSyncedSearchRef.current) {
      isUserSearchChangeRef.current = false;
      setSearchInputState(filters.search);
      lastSyncedSearchRef.current = filters.search;
    }
  }, [filters.search]);

  useEffect(() => {
    if (!isUserSearchChangeRef.current || debouncedSearchInput !== searchInput) return;

    isUserSearchChangeRef.current = false;
    if (debouncedSearchInput !== filters.search) {
      lastSyncedSearchRef.current = debouncedSearchInput;
      setFilters({
        search: debouncedSearchInput || null,
        page: 1,
      });
    }
  }, [debouncedSearchInput, filters.search, searchInput, setFilters]);

  const updateFilter = <K extends keyof TermsFiltersState>(key: K, value: TermsFiltersState[K]) => {
    setFilters({ [key]: value, page: 1 });
  };

  const clearFilters = () => {
    isUserSearchChangeRef.current = false;
    lastSyncedSearchRef.current = '';
    setSearchInputState('');
    setFilters({
      page: 1,
      limit: DEFAULT_TERMS_PAGE_SIZE,
      sort: DEFAULT_TERMS_SORT,
      order: DEFAULT_TERMS_ORDER,
      search: null,
      status: null,
      termsType: null,
      brandEnum: null,
      includeDeleted: 'false',
    });
  };

  const queryParams = (() => {
    const parsed = TermsListApiQuerySchema.safeParse({
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
      order: filters.order,
      search: filters.search || undefined,
      status: filters.status || undefined,
      termsType: filters.termsType || undefined,
      brandEnum: filters.brandEnum || undefined,
      includeDeleted: filters.includeDeleted === 'true',
    });
    if (parsed.success) return parsed.data;
    return {
      page: filters.page,
      limit: DEFAULT_TERMS_PAGE_SIZE,
      sort: 'displayOrder' as const,
      order: 'asc' as const,
      includeDeleted: false,
    } satisfies TermsListApiQuery;
  })();

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.status !== null ||
    filters.termsType !== null ||
    filters.brandEnum !== null ||
    filters.includeDeleted === 'true';

  return {
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    queryParams,
    hasActiveFilters,
    filteredTotal: 0,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextPageSize: number) => setFilters({ limit: nextPageSize, page: 1 }),
  };
}

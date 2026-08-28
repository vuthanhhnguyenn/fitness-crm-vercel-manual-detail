import { TERMS_DEFAULT_PAGE_SIZE } from '@/app/(private)/terms/_constants/constants';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import { type GetTermsQuery, TermsBrand, TermsStatus, TermsType } from '@/lib/api/types.gen';

export function useTermsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(TERMS_DEFAULT_PAGE_SIZE),
      query: parseAsString.withDefault(''),
      termsType: parseAsStringEnum<TermsType>(Object.values(TermsType)),
      brandEnum: parseAsStringEnum<TermsBrand>(Object.values(TermsBrand)),
      status: parseAsStringEnum<TermsStatus>(Object.values(TermsStatus)),
      includeDeleted: parseAsBoolean.withDefault(false),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.query, (value) =>
    setFilters({ query: value || null, page: 1 }),
  );

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: TERMS_DEFAULT_PAGE_SIZE,
      query: null,
      brandEnum: null,
      status: null,
      includeDeleted: false,
    });
  };

  const hasActiveFilters =
    filters.query.length > 0 || filters.brandEnum !== null || filters.status !== null;

  const activeFilterCount = [filters.brandEnum !== null, filters.status !== null].filter(
    Boolean,
  ).length;

  const queryParams: NonNullable<GetTermsQuery> = {
    page: filters.page,
    limit: filters.limit,
    query: filters.query || undefined,
    termsType: filters.termsType ?? undefined,
    brandEnum: filters.brandEnum ?? undefined,
    status: filters.status ?? undefined,
    includeDeleted: filters.includeDeleted,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}

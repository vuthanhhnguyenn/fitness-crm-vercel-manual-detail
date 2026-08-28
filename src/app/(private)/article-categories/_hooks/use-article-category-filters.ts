import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import {
  ArticleCategorySort,
  ArticleCategoryType,
  BrandEnum,
  GetArticleCategoriesQueryParams,
} from '@/lib/api/types.gen';

import { ARTICLE_CATEGORY_DEFAULT_PAGE_SIZE } from '../_constants/article-category.constants';

export function useArticleCategoryFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(ARTICLE_CATEGORY_DEFAULT_PAGE_SIZE),
      query: parseAsString.withDefault(''),
      type: parseAsStringEnum<ArticleCategoryType>(Object.values(ArticleCategoryType)),
      brandEnum: parseAsStringEnum<BrandEnum>(Object.values(BrandEnum)),
      isPublic: parseAsBoolean,
      sort: parseAsStringEnum<ArticleCategorySort>(Object.values(ArticleCategorySort)),
      order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.query, (value) =>
    setFilters({ query: value || null, page: 1 }),
  );

  const updateFilter = <K extends keyof GetArticleCategoriesQueryParams>(
    key: K,
    value: GetArticleCategoriesQueryParams[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: ARTICLE_CATEGORY_DEFAULT_PAGE_SIZE,
      query: null,
      type: null,
      brandEnum: null,
      isPublic: null,
      sort: null,
      order: 'asc',
    });
  };

  const activeDetailFilterCount = [
    filters.type !== null,
    filters.brandEnum !== null,
    filters.isPublic !== null,
  ].filter(Boolean).length;

  const hasActiveFilters = activeDetailFilterCount > 0 || filters.query.length > 0;

  const queryParams: NonNullable<GetArticleCategoriesQueryParams> = {
    page: filters.page,
    limit: filters.limit as 25 | 50 | 100 | 200,
    query: filters.query || undefined,
    type: filters.type ?? undefined,
    brandEnum: filters.brandEnum ?? undefined,
    isPublic: filters.isPublic ?? undefined,
    sort: filters.sort ?? undefined,
    order: filters.order,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeDetailFilterCount,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}

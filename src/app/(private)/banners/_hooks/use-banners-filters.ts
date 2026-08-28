import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import {
  BannerChannel,
  BannerSortBy,
  BannerStatus,
  BrandEnum,
  GetBannersQuery,
} from '@/lib/api/types.gen';

import { BANNER_DEFAULT_PAGE_SIZE } from '../_constants/banner.constants';

export function useBannersFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(BANNER_DEFAULT_PAGE_SIZE),
      query: parseAsString.withDefault(''),
      brandEnum: parseAsStringEnum<BrandEnum>(Object.values(BrandEnum)),
      channel: parseAsStringEnum<BannerChannel>(Object.values(BannerChannel)),
      status: parseAsStringEnum<BannerStatus>(Object.values(BannerStatus)),
      sort: parseAsStringEnum<BannerSortBy>(Object.values(BannerSortBy)).withDefault('order'),
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

  const updateFilter = <K extends keyof GetBannersQuery>(key: K, value: GetBannersQuery[K]) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: BANNER_DEFAULT_PAGE_SIZE,
      query: null,
      brandEnum: null,
      channel: null,
      status: null,
      sort: 'order',
      order: 'asc',
    });
  };

  const hasActiveFilters =
    filters.query.length > 0 ||
    filters.brandEnum !== null ||
    filters.channel !== null ||
    filters.status !== null;

  const activeDetailFilterCount = [
    filters.brandEnum !== null,
    filters.channel !== null,
    filters.status !== null,
  ].filter(Boolean).length;

  const queryParams: NonNullable<GetBannersQuery> = {
    page: filters.page,
    limit: filters.limit,
    query: filters.query || undefined,
    brandEnum: filters.brandEnum || undefined,
    channel: filters.channel || undefined,
    status: filters.status || undefined,
    sort: filters.sort,
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

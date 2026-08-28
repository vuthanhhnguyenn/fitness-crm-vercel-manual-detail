import { parseAsInteger, parseAsStringEnum, useQueryStates } from 'nuqs';

import { AppVersionBrandEnum, GetCrmAppVersionsData } from '@/lib/api/types.gen';

import { DEFAULT_PAGE_SIZE } from '../_constants/app-version.constants';

export function useAppVersionsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
      brandEnum: parseAsStringEnum<AppVersionBrandEnum>(Object.values(AppVersionBrandEnum)),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const hasActiveFilters = filters.brandEnum !== null;

  const clearFilters = () => {
    setFilters({ page: 1, limit: DEFAULT_PAGE_SIZE, brandEnum: null });
  };

  const queryParams: NonNullable<GetCrmAppVersionsData['query']> = {
    page: filters.page,
    limit: filters.limit,
    sort: 'releaseDate',
    order: 'desc',
    brandEnum: filters.brandEnum ?? undefined,
  };

  return {
    filters,
    setFilters,
    queryParams,
    hasActiveFilters,
    clearFilters,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}

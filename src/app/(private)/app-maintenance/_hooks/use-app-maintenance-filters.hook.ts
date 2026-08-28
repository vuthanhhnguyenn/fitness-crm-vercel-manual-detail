import { APP_MAINTENANCE_DEFAULT_PAGE_SIZE } from '@/app/(private)/app-maintenance/_constants/app-maintenance.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import {
  AppMaintenanceSortBy,
  AppMaintenanceStatus,
  AppMaintenanceTargetBrand,
  type GetAppMaintenancesQuery,
} from '@/lib/api/types.gen';

export function useAppMaintenanceFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(APP_MAINTENANCE_DEFAULT_PAGE_SIZE),
      search: parseAsString.withDefault(''),
      brand: parseAsStringEnum<AppMaintenanceTargetBrand>(Object.values(AppMaintenanceTargetBrand)),
      status: parseAsStringEnum<AppMaintenanceStatus>(Object.values(AppMaintenanceStatus)),
      sort: parseAsStringEnum<AppMaintenanceSortBy>(
        Object.values(AppMaintenanceSortBy),
      ).withDefault(AppMaintenanceSortBy.STARTS_AT),
      order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('desc'),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: APP_MAINTENANCE_DEFAULT_PAGE_SIZE,
      search: null,
      brand: null,
      status: null,
      sort: AppMaintenanceSortBy.STARTS_AT,
      order: 'desc',
    });
  };

  const hasActiveFilters =
    filters.search.length > 0 || filters.brand !== null || filters.status !== null;

  const activeFilterCount = [filters.brand !== null, filters.status !== null].filter(
    Boolean,
  ).length;

  const queryParams: NonNullable<GetAppMaintenancesQuery> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    brand: filters.brand ?? undefined,
    status: filters.status ?? undefined,
    sort: filters.sort,
    order: filters.order,
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

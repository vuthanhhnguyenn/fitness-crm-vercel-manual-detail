import { CRM_MAINTENANCE_DEFAULT_PAGE_SIZE } from '@/app/(private)/crm-maintenance/_constants/crm-maintenance.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import {
  CrmMaintenanceSortBy,
  CrmMaintenanceStatus,
  type GetCrmMaintenancesQuery,
} from '@/lib/api/types.gen';

export function useCrmMaintenanceFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(CRM_MAINTENANCE_DEFAULT_PAGE_SIZE),
      search: parseAsString.withDefault(''),
      status: parseAsStringEnum<CrmMaintenanceStatus>(Object.values(CrmMaintenanceStatus)),
      sort: parseAsStringEnum<CrmMaintenanceSortBy>(
        Object.values(CrmMaintenanceSortBy),
      ).withDefault(CrmMaintenanceSortBy.STARTS_AT),
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
      limit: CRM_MAINTENANCE_DEFAULT_PAGE_SIZE,
      search: null,
      status: null,
      sort: CrmMaintenanceSortBy.STARTS_AT,
      order: 'desc',
    });
  };

  const hasActiveFilters = filters.search.length > 0 || filters.status !== null;

  const activeFilterCount = [filters.status !== null].filter(Boolean).length;

  const queryParams: NonNullable<GetCrmMaintenancesQuery> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
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

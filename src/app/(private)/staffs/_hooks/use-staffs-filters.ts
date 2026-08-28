import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import { StaffRole, StaffStatus } from '../_constants/constants';

export type StaffsFilters = {
  page: number;
  limit: number;
  search: string;
  role: StaffRole | null;
  position_id: number | null;
  store_id: string | null;
  status: StaffStatus | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

export function useStaffsFilters() {
  // Use nuqs for URL query parameters
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      role: parseAsStringEnum<StaffRole>(Object.values(StaffRole)),
      position_id: parseAsInteger,
      store_id: parseAsString,
      status: parseAsStringEnum<StaffStatus>(Object.values(StaffStatus)),
      sort_by: parseAsString.withDefault('staff_id'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const updateFilter = <K extends keyof StaffsFilters>(key: K, value: StaffsFilters[K]) => {
    setFilters({ [key]: value ?? null, page: 1 } as any);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      role: null,
      position_id: null,
      store_id: null,
      status: null,
      sort_by: 'staff_id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters: boolean =
    filters.role !== null ||
    filters.position_id !== null ||
    filters.store_id !== null ||
    filters.status !== null ||
    filters.search.length > 0;

  // Build query params for API call
  const queryParams = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    role: filters.role || undefined,
    position_id: filters.position_id ?? undefined,
    store_id: filters.store_id || undefined,
    status: filters.status || undefined,
    sort_by: filters.sort_by as
      | 'staff_id'
      | 'name'
      | 'role'
      | 'position_name'
      | 'status'
      | 'last_login',
    sort_order: filters.sort_order,
  };

  return {
    // Search input (local state for debouncing)
    searchInput,
    setSearchInput,
    // Filters from URL
    filters,
    // Update functions
    updateFilter,
    setFilters,
    clearFilters,
    // Computed
    hasActiveFilters,
    // Query params for API
    queryParams,
    // Pagination
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage } as any),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 } as any),
    // Sort helpers
    handleSortChange: (field: string, order: 'asc' | 'desc') => {
      setFilters({ sort_by: field, sort_order: order });
    },
  };
}

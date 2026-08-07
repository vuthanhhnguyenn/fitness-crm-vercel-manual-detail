import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { StaffBrand, StaffRole, StaffStatus } from '../_constants/constants';

export type StaffsFilters = {
  page: number;
  search: string;
  role: StaffRole | null;
  position_id: number | null;
  brand: StaffBrand | null;
  status: StaffStatus | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

export function useStaffsFilters() {
  // Use nuqs for URL query parameters
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(''),
      role: parseAsStringEnum<StaffRole>(Object.values(StaffRole)),
      position_id: parseAsInteger,
      brand: parseAsStringEnum<StaffBrand>(Object.values(StaffBrand)),
      status: parseAsStringEnum<StaffStatus>(Object.values(StaffStatus)),
      sort_by: parseAsString.withDefault('staff_id'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  // Initialized from URL so the input reflects any pre-existing search param
  const [searchInput, setSearchInput] = useState(() => filters.search);

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

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
      brand: null,
      status: null,
      sort_by: 'staff_id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters: boolean =
    filters.role !== null ||
    filters.position_id !== null ||
    filters.brand !== null ||
    filters.status !== null ||
    filters.search.length > 0;

  // Build query params for API call
  const queryParams = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    role: filters.role || undefined,
    position_id: filters.position_id ?? undefined,
    brand: filters.brand || undefined,
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
    pageSize: PAGE_SIZE,
    // Sort helpers
    handleSortChange: (field: string, order: 'asc' | 'desc') => {
      setFilters({ sort_by: field, sort_order: order });
    },
  };
}

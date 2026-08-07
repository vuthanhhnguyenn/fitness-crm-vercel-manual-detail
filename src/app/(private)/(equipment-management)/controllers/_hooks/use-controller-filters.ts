import { useEffect, useState } from 'react';

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmControllersData } from '@/lib/api/types.gen';

type ControllerQuery = NonNullable<GetCrmControllersData['query']>;

const CONTROLLER_STATUS_VALUES = ['normal', 'error', 'maintenance', 'discarded'] satisfies Array<
  NonNullable<ControllerQuery['status']>
>;

const CONTROLLER_SORT_VALUES = [
  'controller_id',
  'name',
  'store_code',
  'location',
  'ip_address',
  'firmware_version',
  'control_port_count',
  'device_count',
  'status',
] satisfies Array<NonNullable<ControllerQuery['sort_by']>>;

const CONTROLLER_DEFAULT_LIMIT = 50;

export function useControllerFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      controller_search: parseAsString.withDefault(''),
      controller_store_id: parseAsString,
      controller_status: parseAsStringEnum(CONTROLLER_STATUS_VALUES),
      controller_sort_by: parseAsStringEnum(CONTROLLER_SORT_VALUES).withDefault('controller_id'),
      controller_sort_order: parseAsStringEnum(['asc', 'desc']).withDefault('asc'),
      controller_page: parseAsInteger.withDefault(1),
      controller_limit: parseAsInteger.withDefault(CONTROLLER_DEFAULT_LIMIT),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const [searchInput, setSearchInput] = useState(() => filters.controller_search);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== filters.controller_search) {
        setFilters({
          controller_search: searchInput || null,
          controller_page: 1,
        });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filters.controller_search, searchInput, setFilters]);

  const clearFilterSelects = () => {
    setFilters({
      controller_store_id: null,
      controller_status: null,
      controller_page: 1,
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      controller_search: null,
      controller_store_id: null,
      controller_status: null,
      controller_sort_by: 'controller_id',
      controller_sort_order: 'asc',
      controller_page: 1,
      controller_limit: CONTROLLER_DEFAULT_LIMIT,
    });
  };

  const normalizedLimit =
    filters.controller_limit > 0 && filters.controller_limit <= 50
      ? (filters.controller_limit as NonNullable<ControllerQuery['limit']>)
      : CONTROLLER_DEFAULT_LIMIT;

  const queryParams: ControllerQuery = {
    search: filters.controller_search || undefined,
    store_id: filters.controller_store_id || undefined,
    status: filters.controller_status || undefined,
    sort_by: filters.controller_sort_by as NonNullable<ControllerQuery['sort_by']>,
    sort_order: filters.controller_sort_order,
    page: filters.controller_page,
    limit: normalizedLimit,
  };

  const activeFilterCount = [
    filters.controller_store_id != null,
    filters.controller_status != null,
  ].filter(Boolean).length;

  return {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    clearFilterSelects,
    currentPage: filters.controller_page,
    setCurrentPage: (page: number) => setFilters({ controller_page: page }),
    setPageSize: (limit: number) => setFilters({ controller_limit: limit, controller_page: 1 }),
    pageSize: normalizedLimit,
    hasActiveFilters:
      filters.controller_search.length > 0 ||
      filters.controller_store_id != null ||
      filters.controller_status != null,
    activeFilterCount,
  };
}

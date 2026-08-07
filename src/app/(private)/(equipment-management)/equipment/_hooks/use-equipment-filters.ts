import { useEffect, useState } from 'react';

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmEquipmentData } from '@/lib/api/types.gen';

type EquipmentQuery = NonNullable<GetCrmEquipmentData['query']>;

const EQUIPMENT_TYPE_VALUES = [
  'entry_gate',
  'hydrogen_water_server',
  'body_composition_monitor',
  'tanning_machine',
  'protein_server',
  'other',
] satisfies Array<NonNullable<EquipmentQuery['equipment_type']>>;

const EQUIPMENT_STATUS_VALUES = ['normal', 'error', 'maintenance', 'discarded'] satisfies Array<
  NonNullable<EquipmentQuery['status']>
>;

const EQUIPMENT_SORT_VALUES = [
  'id',
  'name',
  'controller_number',
  'qr_code_id',
  'equipment_type',
  'status',
  'updated_at',
] satisfies Array<NonNullable<EquipmentQuery['sort_by']>>;

const EQUIPMENT_LIMIT_VALUES: Array<NonNullable<EquipmentQuery['limit']>> = [25, 50, 100, 200];

export function useEquipmentFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      equipment_search: parseAsString.withDefault(''),
      equipment_store_id: parseAsString,
      equipment_type: parseAsStringEnum(EQUIPMENT_TYPE_VALUES),
      equipment_status: parseAsStringEnum(EQUIPMENT_STATUS_VALUES),
      equipment_sort_by: parseAsStringEnum(EQUIPMENT_SORT_VALUES).withDefault('id'),
      equipment_sort_order: parseAsStringEnum(['asc', 'desc']).withDefault('asc'),
      equipment_page: parseAsInteger.withDefault(1),
      equipment_limit: parseAsInteger.withDefault(50),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const [searchInput, setSearchInput] = useState(() => filters.equipment_search);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== filters.equipment_search) {
        setFilters({
          equipment_search: searchInput || null,
          equipment_page: 1,
        });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filters.equipment_search, searchInput, setFilters]);

  const clearFilterSelects = () => {
    setFilters({
      equipment_store_id: null,
      equipment_type: null,
      equipment_status: null,
      equipment_page: 1,
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      equipment_search: null,
      equipment_store_id: null,
      equipment_type: null,
      equipment_status: null,
      equipment_sort_by: 'id',
      equipment_sort_order: 'asc',
      equipment_page: 1,
      equipment_limit: 50,
    });
  };

  const normalizedLimit = EQUIPMENT_LIMIT_VALUES.includes(
    filters.equipment_limit as (typeof EQUIPMENT_LIMIT_VALUES)[number],
  )
    ? (filters.equipment_limit as NonNullable<EquipmentQuery['limit']>)
    : 50;

  const queryParams: EquipmentQuery = {
    search: filters.equipment_search || undefined,
    store_id: filters.equipment_store_id || undefined,
    equipment_type: filters.equipment_type || undefined,
    status: filters.equipment_status || undefined,
    sort_by: filters.equipment_sort_by as NonNullable<EquipmentQuery['sort_by']>,
    sort_order: filters.equipment_sort_order,
    page: filters.equipment_page,
    limit: normalizedLimit,
  };

  const activeFilterCount = [
    filters.equipment_store_id != null,
    filters.equipment_type != null,
    filters.equipment_status != null,
  ].filter(Boolean).length;

  return {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    clearFilterSelects,
    currentPage: filters.equipment_page,
    setCurrentPage: (page: number) => setFilters({ equipment_page: page }),
    setPageSize: (limit: number) => setFilters({ equipment_limit: limit, equipment_page: 1 }),
    pageSize: normalizedLimit,
    hasActiveFilters:
      filters.equipment_search.length > 0 ||
      filters.equipment_store_id != null ||
      filters.equipment_type != null ||
      filters.equipment_status != null,
    activeFilterCount,
  };
}

import { useEffect, useState } from 'react';

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmTrainingEquipmentData } from '@/lib/api/types.gen';

import {
  TRAINING_EQUIPMENT_PAGE_SIZE_OPTIONS,
  TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
} from '../_constants/training-equipment.constants';

type TrainingEquipmentQuery = NonNullable<GetCrmTrainingEquipmentData['query']>;

const TOOL_TYPE_VALUES = [
  'machine',
  'cableMachine',
  'smithMachine',
  'barbell',
  'dumbbell',
  'kettlebell',
  'resistanceBand',
  'trx',
  'other',
] satisfies Array<NonNullable<TrainingEquipmentQuery['tool_type']>>;

const STATUS_VALUES = [
  'installed',
  'maintenance',
  'removed',
  'discarded',
  'exclude_discarded',
  'all',
] satisfies Array<NonNullable<TrainingEquipmentQuery['status']>>;

const SORT_BY_VALUES = [
  'id',
  'name',
  'tool_type',
  'quantity',
  'installation_area',
  'status',
  'last_updated_at',
] satisfies Array<NonNullable<TrainingEquipmentQuery['sort_by']>>;

type TrainingEquipmentStatusFilter = (typeof STATUS_VALUES)[number];

export type TrainingEquipmentUrlFilters = {
  te_keyword: string;
  te_tool_type: TrainingEquipmentQuery['tool_type'] | null;
  te_status: TrainingEquipmentStatusFilter;
  te_sort_by: TrainingEquipmentQuery['sort_by'] | null;
  te_sort_order: 'asc' | 'desc' | null;
  te_page: number;
  te_page_size: number;
};

export function useTrainingEquipmentFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      te_keyword: parseAsString.withDefault(''),
      te_tool_type: parseAsStringEnum(TOOL_TYPE_VALUES),
      te_status: parseAsStringEnum(STATUS_VALUES).withDefault(
        TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
      ),
      te_sort_by: parseAsStringEnum(SORT_BY_VALUES),
      te_sort_order: parseAsStringEnum(['asc', 'desc']),
      te_page: parseAsInteger.withDefault(1),
      te_page_size: parseAsInteger.withDefault(50),
    },
    { history: 'push', shallow: false },
  );

  const [searchInput, setSearchInput] = useState(() => filters.te_keyword);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== filters.te_keyword) {
        setFilters({ te_keyword: searchInput || null, te_page: 1 });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.te_keyword, searchInput, setFilters]);

  const normalizedPageSize = TRAINING_EQUIPMENT_PAGE_SIZE_OPTIONS.includes(
    filters.te_page_size as (typeof TRAINING_EQUIPMENT_PAGE_SIZE_OPTIONS)[number],
  )
    ? filters.te_page_size
    : 50;

  const queryParams: TrainingEquipmentQuery = {
    keyword: filters.te_keyword || undefined,
    tool_type: filters.te_tool_type || undefined,
    status: filters.te_status,
    sort_by: filters.te_sort_by || undefined,
    sort_order:
      filters.te_sort_order === 'asc' || filters.te_sort_order === 'desc'
        ? filters.te_sort_order
        : undefined,
    page: filters.te_page,
    page_size: normalizedPageSize,
  };

  const clearFilterSelects = () => {
    setFilters({
      te_tool_type: null,
      te_status: TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
      te_page: 1,
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      te_keyword: null,
      te_tool_type: null,
      te_status: TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
      te_sort_by: null,
      te_sort_order: null,
      te_page: 1,
      te_page_size: 50,
    });
  };

  const activeFilterCount = [
    filters.te_tool_type != null,
    filters.te_status !== TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
  ].filter(Boolean).length;

  return {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    clearFilterSelects,
    currentPage: filters.te_page,
    setCurrentPage: (page: number) => setFilters({ te_page: page }),
    setPageSize: (pageSize: number) => setFilters({ te_page_size: pageSize, te_page: 1 }),
    pageSize: normalizedPageSize,
    hasActiveFilters:
      filters.te_keyword.length > 0 ||
      filters.te_tool_type != null ||
      filters.te_status !== TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
    activeFilterCount,
  };
}

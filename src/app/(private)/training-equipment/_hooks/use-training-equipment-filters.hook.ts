import { useEffect, useRef } from 'react';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type {
  GetCrmTrainingEquipmentData,
  GetCrmTrainingEquipmentExportData,
} from '@/lib/api/types.gen';

import {
  TRAINING_EQUIPMENT_DEFAULT_PAGE_SIZE,
  TRAINING_EQUIPMENT_PAGE_SIZE_OPTIONS,
  TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
  TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS,
} from '../_constants/training-equipment.constants';
import {
  type TrainingEquipmentStatusFilter,
  toInstallationStatusParams,
} from '../_utils/training-equipment-query.util';

type TrainingEquipmentQuery = NonNullable<GetCrmTrainingEquipmentData['query']>;
type TrainingEquipmentExportQuery = NonNullable<GetCrmTrainingEquipmentExportData['query']>;

const STATUS_FILTER_VALUES = TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS.map((option) => option.value);

const SORT_VALUES = [
  'id',
  'name',
  'toolType',
  'locationInGym',
  'installationStatus',
  'updatedAt',
] satisfies Array<NonNullable<TrainingEquipmentQuery['sort']>>;

export type { TrainingEquipmentStatusFilter };

export type TrainingEquipmentUrlFilters = {
  te_keyword: string;
  te_tool: string | null;
  te_status: TrainingEquipmentStatusFilter;
  te_sort: NonNullable<TrainingEquipmentQuery['sort']> | null;
  te_order: 'asc' | 'desc' | null;
  te_page: number;
  te_limit: number;
};

/**
 * Keeps the FR-002 filter conditions in the URL. The status filter is converted into the API
 * design's two axes: `installationStatus` + `includeDiscarded`.
 */
export function useTrainingEquipmentFilters() {
  const { currentStoreId, canSelectAllStores, isLoading: isStoreLoading } = useCurrentStore();
  const [filters, setFilters] = useQueryStates(
    {
      te_keyword: parseAsString.withDefault(''),
      te_tool: parseAsString,
      te_status: parseAsStringEnum([...STATUS_FILTER_VALUES]).withDefault(
        TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
      ),
      te_sort: parseAsStringEnum(SORT_VALUES),
      te_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']),
      te_page: parseAsInteger.withDefault(1),
      te_limit: parseAsInteger.withDefault(TRAINING_EQUIPMENT_DEFAULT_PAGE_SIZE),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.te_keyword, (value) =>
    setFilters({ te_keyword: value || null, te_page: 1 }),
  );

  // A new store scope is a new result set, so the current page offset no longer means anything.
  // The first resolved scope is not a change — only later switches reset the page.
  const previousStoreIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isStoreLoading) return;

    const previousStoreId = previousStoreIdRef.current;
    previousStoreIdRef.current = currentStoreId;
    if (previousStoreId === null || previousStoreId === currentStoreId) return;

    setFilters({ te_page: 1 });
  }, [currentStoreId, isStoreLoading, setFilters]);

  const limit = TRAINING_EQUIPMENT_PAGE_SIZE_OPTIONS.includes(
    filters.te_limit as (typeof TRAINING_EQUIPMENT_PAGE_SIZE_OPTIONS)[number],
  )
    ? filters.te_limit
    : TRAINING_EQUIPMENT_DEFAULT_PAGE_SIZE;

  const statusParams = toInstallationStatusParams(filters.te_status);

  // 「全店舗（本部）」 is selectable by HQ roles only (`canSelectAllStores`). Only then is `storeId`
  // omitted to fetch across stores; every other case sends the own store (omitting it is a 400).
  const isAllStoresScope = canSelectAllStores && currentStoreId === ALL_STORES;
  const scopedStoreId = isAllStoresScope ? undefined : currentStoreId;

  // The CSV export (FR-010) is "what the list currently shows": the same filters and ordering as
  // the list, only without pagination. Built from the same source so the URL is not parsed twice.
  const exportParams: TrainingEquipmentExportQuery = {
    storeId: scopedStoreId,
    keyword: filters.te_keyword || undefined,
    mstToolId: filters.te_tool || undefined,
    ...statusParams,
    sort: filters.te_sort || undefined,
    order: filters.te_order || undefined,
  };

  const queryParams: TrainingEquipmentQuery = {
    ...exportParams,
    includeTotalAll: true,
    page: filters.te_page,
    limit,
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      te_keyword: null,
      te_tool: null,
      te_status: TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
      te_page: 1,
    });
  };

  return {
    filters,
    queryParams,
    exportParams,
    /**
     * Do not hit the list until the store scope is settled. For roles limited to a single store
     * `currentStoreId` is only known after the store list loads, so firing earlier means a 400 with no `storeId`.
     */
    isStoreScopeReady: !isStoreLoading && (isAllStoresScope || currentStoreId !== ALL_STORES),
    isAllStoresScope,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    currentPage: filters.te_page,
    setCurrentPage: (page: number) => setFilters({ te_page: page }),
    pageSize: limit,
    setPageSize: (nextLimit: number) => setFilters({ te_limit: nextLimit, te_page: 1 }),
    hasActiveFilters:
      filters.te_keyword.length > 0 ||
      filters.te_tool != null ||
      filters.te_status !== TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
  };
}

import { useEffect, useState } from 'react';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { formatISODateLocal } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { addMonths, endOfMonth, endOfYear, startOfMonth, startOfYear } from 'date-fns';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import {
  getCrmMembersByIdOptions,
  getCrmStoresByIdOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { Brand, GetCrmLeavesData, LeaveListStatus, LeaveType } from '@/lib/api/types.gen';

import { BRAND_LABELS } from '../../_constants/constants';
import { LEAVE_PAGE_SIZE_OPTIONS, LIST_LEAVE_STATUSES } from '../_constants/constants';

/**
 * FR-025 — the four presets the screen offers. `all` is the absence of a bound, so it is
 * represented by a null filter value rather than an option of its own.
 */
export type ScheduledPeriod = 'current_month' | 'next_month' | 'current_year';

export type LeavesFilters = {
  page: number;
  page_size: number;
  search: string;
  type: LeaveType | null;
  status: LeaveListStatus | null;
  brand: Brand | null;
  store_id: string | null;
  /** Set by the A-01-01 drill-down; there is no in-screen control for it. */
  member_id: string | null;
  scheduled_period: ScheduledPeriod | null;
};

const SCHEDULED_PERIODS: ScheduledPeriod[] = ['current_month', 'next_month', 'current_year'];

function resolveScheduledRange(period: ScheduledPeriod | null): {
  scheduled_from?: string;
  scheduled_to?: string;
} {
  if (!period) return {};

  const now = new Date();
  const anchor = period === 'next_month' ? addMonths(now, 1) : now;
  const [from, to] =
    period === 'current_year'
      ? [startOfYear(now), endOfYear(now)]
      : [startOfMonth(anchor), endOfMonth(anchor)];

  return {
    scheduled_from: formatISODateLocal(from),
    scheduled_to: formatISODateLocal(to),
  };
}

/** Single source of truth for the brand set — the same map the filter renders from. */
const BRAND_VALUES = Object.keys(BRAND_LABELS) as Brand[];

export function useLeavesFilters() {
  const { currentStoreId, restrictedStores, canSelectAllStores } = useCurrentStore();

  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      page_size: parseAsInteger.withDefault(LEAVE_PAGE_SIZE_OPTIONS[0]),
      search: parseAsString.withDefault(''),
      type: parseAsStringEnum<LeaveType>(['suspension', 'withdrawal']),
      status: parseAsStringEnum<LeaveListStatus>([...LIST_LEAVE_STATUSES]),
      brand: parseAsStringEnum<Brand>(BRAND_VALUES),
      store_id: parseAsString,
      member_id: parseAsString,
      scheduled_period: parseAsStringEnum<ScheduledPeriod>(SCHEDULED_PERIODS),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const [storeFilterPick, setStoreFilterPick] = useState<{ id: string; name: string } | null>(null);

  /**
   * FR-004 — the header store scope always wins. When it narrows to a single store the
   * in-screen 店舗 filter is hidden, so a stale value must not keep narrowing the result.
   */
  const isSingleStoreScope = currentStoreId !== ALL_STORES;
  useEffect(() => {
    if (isSingleStoreScope && filters.store_id !== null) {
      setFilters({ store_id: null, page: 1 });
    }
  }, [isSingleStoreScope, filters.store_id, setFilters]);

  /** FR-005 — the in-screen store filter only makes sense across two or more stores. */
  const showStoreFilter =
    !isSingleStoreScope && (canSelectAllStores || restrictedStores.length >= 2);

  const updateFilter = <K extends keyof LeavesFilters>(key: K, value: LeavesFilters[K]) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  /**
   * Picking a store remembers its name in the same step, so the trigger and the banner
   * have a label without a by-id round-trip. The lookup below only runs on a deep link.
   */
  const selectStoreFilter = (store: { id: string; name: string } | null) => {
    setStoreFilterPick(store);
    updateFilter('store_id', store?.id ?? null);
  };

  const storeNameFromPick =
    storeFilterPick?.id === filters.store_id ? (storeFilterPick?.name ?? null) : null;
  const { data: storeByIdRes } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: filters.store_id ?? '' } }),
    enabled: !!filters.store_id && !storeNameFromPick,
  });
  const storeFilterLabel = filters.store_id
    ? (storeNameFromPick ?? storeByIdRes?.store?.name ?? filters.store_id)
    : null;

  /**
   * The member filter arrives from the A-01-01 履歴ストリップ deep link, so its label has to
   * be resolved by id — there is no picker to remember a name from.
   */
  const { data: memberByIdRes } = useQuery({
    ...getCrmMembersByIdOptions({ path: { id: filters.member_id ?? '' } }),
    enabled: !!filters.member_id,
  });
  const memberFilterLabel = filters.member_id
    ? [memberByIdRes?.personalInfo.lastName, memberByIdRes?.personalInfo.firstName]
        .filter(Boolean)
        .join(' ') || filters.member_id
    : null;

  const clearFilters = () => {
    setSearchInput('');
    setStoreFilterPick(null);
    setFilters({
      page: 1,
      search: null,
      type: null,
      status: null,
      brand: null,
      store_id: null,
      member_id: null,
      scheduled_period: null,
    });
  };

  /**
   * FR-026 — the header scope is deliberately excluded from the count. `member_id` is too:
   * the badge counts the controls inside 詳細フィルター, and the member filter has none.
   * It still shows in the result banner, which is where it can be cleared.
   */
  const activeFilterCount = [
    filters.type,
    filters.status,
    filters.brand,
    filters.scheduled_period,
    showStoreFilter ? filters.store_id : null,
  ].filter(Boolean).length;

  const hasActiveFilters: boolean =
    activeFilterCount > 0 || filters.search.length > 0 || filters.member_id !== null;

  const queryParams: NonNullable<GetCrmLeavesData['query']> = {
    page: String(filters.page),
    limit: String(filters.page_size),
    search: filters.search || undefined,
    type: filters.type ?? undefined,
    status: filters.status ?? undefined,
    brand: filters.brand ?? undefined,
    /**
     * FR-004 — the header scope must actually narrow the request, not merely hide controls.
     * The role scope alone is not enough: a Manager's scope spans every managed store, so
     * without this the 店舗名 column would be hidden over rows from several stores. It travels
     * as `scope_store_id`, not `store_id`, so it lands in the banner's denominator rather
     * than being counted as an in-screen filter (FR-024).
     */
    scope_store_id: isSingleStoreScope ? currentStoreId : undefined,
    store_id: (showStoreFilter ? filters.store_id : null) ?? undefined,
    member_id: filters.member_id ?? undefined,
    // FR-025a — the preset lives in the URL; the request carries the range it resolves to.
    ...resolveScheduledRange(filters.scheduled_period),
    // FR-035a — ordering is fixed server-side (scheduled_date asc); V0 offers no sort
    // control, so `sort_by` / `sort_order` are deliberately never sent (Q-13).
  };

  return {
    filters,
    setFilters,
    updateFilter,
    selectStoreFilter,
    storeFilterLabel,
    memberFilterLabel,
    searchInput,
    setSearchInput,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (page: number) => setFilters({ page }),
    pageSize: filters.page_size,
    setPageSize: (size: number) => setFilters({ page_size: size, page: 1 }),
    showStoreFilter,
    activeFilterCount,
    hasActiveFilters,
    clearFilters,
  };
}

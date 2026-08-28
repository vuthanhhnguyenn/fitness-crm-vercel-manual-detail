'use client';

import { useState } from 'react';

import { useCurrentStore } from '@/contexts/current-store.context';
import { formatISODateLocal } from '@/utils/date.util';
import { subDays } from 'date-fns';
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmMembershipApplicationsData } from '@/lib/api/types.gen';

import {
  DEFAULT_DATE_RANGE_DAYS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '../_constants/constants';

const STATUS_VALUES = [
  'pending',
  'review',
  'approved',
  'auto_approved',
  'rejected',
  'cancelled',
] as const;
const ROUTE_VALUES = ['mobile', 'manual', 'referral'] as const;
const BLACKLIST_VALUES = ['all', 'match', 'no_match'] as const;
const SORT_BY_VALUES = [
  'id',
  'applicant_name',
  'status',
  'application_date',
  'usage_start_date',
] as const;

export type MembershipApplicationsSortBy = (typeof SORT_BY_VALUES)[number];

export type MembershipApplicationsFilters = {
  page: number;
  limit: number;
  search: string;
  status: (typeof STATUS_VALUES)[number] | '';
  route: (typeof ROUTE_VALUES)[number] | '';
  brand: string;
  store: string;
  blacklist: 'all' | 'match' | 'no_match';
  date_from: string;
  date_to: string;
  sort_by: MembershipApplicationsSortBy;
  sort_order: 'asc' | 'desc';
};

/** Default sort direction per key — 申請日時 defaults to newest-first, everything else ascending (FR-009). */
const DEFAULT_SORT_DIR: Record<MembershipApplicationsSortBy, 'asc' | 'desc'> = {
  application_date: 'desc',
  id: 'asc',
  applicant_name: 'asc',
  status: 'asc',
  usage_start_date: 'asc',
};

export function useMembershipApplicationsFilters() {
  const { currentStoreId } = useCurrentStore();
  const isAllStoresView = currentStoreId === 'all';

  const [filters, setFilters] = useQueryStates(
    {
      page: {
        defaultValue: 1,
        parse: (v) => parseInt(v, 10) || 1,
        serialize: String,
      },
      limit: {
        defaultValue: DEFAULT_PAGE_SIZE,
        parse: (v) => {
          const n = parseInt(v, 10);
          return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
        },
        serialize: String,
      },
      search: parseAsString.withDefault(''),
      status: parseAsStringEnum<MembershipApplicationsFilters['status']>([
        ...STATUS_VALUES,
        '' as const,
      ]).withDefault(''),
      route: parseAsStringEnum<MembershipApplicationsFilters['route']>([
        ...ROUTE_VALUES,
        '' as const,
      ]).withDefault(''),
      brand: parseAsString.withDefault(''),
      store: parseAsString.withDefault(''),
      blacklist: parseAsStringEnum<'all' | 'match' | 'no_match'>([...BLACKLIST_VALUES]).withDefault(
        'all',
      ),
      date_from: parseAsString.withDefault(''),
      date_to: parseAsString.withDefault(''),
      sort_by: parseAsStringEnum<MembershipApplicationsSortBy>([...SORT_BY_VALUES]).withDefault(
        'application_date',
      ),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('desc'),
    },
    { history: 'push', shallow: false },
  );

  // Shared with the table so its scroll container can size itself around the
  // filter panel's current height (matches crm-maintenance/app-maintenance's
  // list-section pattern for keeping a sticky header inside a bounded scroller).
  const [showFilters, setShowFilters] = useState(false);

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  // The 7-day default is applied by the client (FR-007) — absence in the URL
  // means "not touched by the user", not "unbounded" (that distinction drives
  // the active-filter count and the result banner).
  const today = new Date();
  const defaultDateFrom = formatISODateLocal(subDays(today, DEFAULT_DATE_RANGE_DAYS - 1));
  const defaultDateTo = formatISODateLocal(today);
  const isDateRangeChanged = !!filters.date_from || !!filters.date_to;

  function updateFilters(patch: Partial<MembershipApplicationsFilters>) {
    setFilters({ ...patch, page: patch.page ?? 1 } as never);
  }

  function setPage(page: number) {
    setFilters({ page });
  }

  function setPageSize(limit: number) {
    setFilters({ limit, page: 1 });
  }

  function toggleSort(key: MembershipApplicationsSortBy) {
    if (filters.sort_by === key) {
      setFilters({ sort_order: filters.sort_order === 'desc' ? 'asc' : 'desc', page: 1 });
    } else {
      setFilters({ sort_by: key, sort_order: DEFAULT_SORT_DIR[key], page: 1 });
    }
  }

  function clearFilters() {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      status: null,
      route: null,
      brand: null,
      store: null,
      blacklist: null,
      date_from: null,
      date_to: null,
      sort_by: null,
      sort_order: null,
    });
  }

  const activeFilterCount = [
    !!filters.status,
    isAllStoresView && !!filters.brand,
    isAllStoresView && !!filters.store,
    isDateRangeChanged,
    filters.blacklist !== 'all',
    !!filters.route,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || !!filters.search;

  const queryParams: NonNullable<GetCrmMembershipApplicationsData['query']> = {
    page: filters.page,
    limit: filters.limit as (typeof PAGE_SIZE_OPTIONS)[number],
    search: filters.search || undefined,
    status: filters.status || undefined,
    route: filters.route || undefined,
    // Brand/store params only apply in the all-stores view — the header
    // store switcher already narrows scope otherwise (FR-015).
    brand: isAllStoresView ? filters.brand || undefined : undefined,
    store: isAllStoresView ? filters.store || undefined : currentStoreId,
    blacklist: filters.blacklist !== 'all' ? filters.blacklist : undefined,
    date_from: filters.date_from || defaultDateFrom,
    date_to: filters.date_to || defaultDateTo,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  };

  return {
    showFilters,
    setShowFilters,
    searchInput,
    setSearchInput,
    filters,
    setFilters: updateFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    isDateRangeChanged,
    defaultDateFrom,
    defaultDateTo,
    isAllStoresView,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: setPage,
    pageSize: filters.limit,
    setPageSize,
    toggleSort,
  };
}

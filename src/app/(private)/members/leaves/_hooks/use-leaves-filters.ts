import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmLeavesData } from '@/lib/api/types.gen';
import { LeaveStatus, LeaveType } from '@/lib/api/types.gen';

type ScheduledPeriod = NonNullable<NonNullable<GetCrmLeavesData['query']>['scheduled_period']>;

export type LeavesFilters = {
  page: number;
  search: string;
  type: LeaveType | null;
  status: LeaveStatus | null;
  brand: string | null;
  store_id: string | null;
  scheduled_period: ScheduledPeriod | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

const SCHEDULED_PERIODS: ScheduledPeriod[] = ['current_month', 'next_month', 'current_year'];

export function useLeavesFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(''),
      type: parseAsStringEnum<LeaveType>(Object.values(LeaveType)),
      status: parseAsStringEnum<LeaveStatus>(Object.values(LeaveStatus)),
      brand: parseAsString,
      store_id: parseAsString,
      scheduled_period: parseAsStringEnum<ScheduledPeriod>(SCHEDULED_PERIODS),
      sort_by: parseAsString.withDefault('applied_at'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('desc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  // Initialized from URL so the input reflects any pre-existing search param
  const [searchInput, setSearchInput] = useState(() => filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const updateFilter = <K extends keyof LeavesFilters>(key: K, value: LeavesFilters[K]) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      type: null,
      status: null,
      brand: null,
      store_id: null,
      scheduled_period: null,
      sort_by: 'applied_at',
      sort_order: 'desc',
    });
  };

  const hasActiveFilters: boolean =
    !!filters.type ||
    !!filters.status ||
    !!filters.brand ||
    !!filters.store_id ||
    !!filters.scheduled_period ||
    filters.search.length > 0;

  const queryParams: NonNullable<GetCrmLeavesData['query']> = {
    page: String(filters.page),
    limit: String(PAGE_SIZE),
    search: filters.search || undefined,
    type: filters.type ?? undefined,
    status: filters.status ?? undefined,
    brand: filters.brand ?? undefined,
    store_id: filters.store_id ?? undefined,
    scheduled_period: filters.scheduled_period ?? undefined,
    sort_by: filters.sort_by as NonNullable<GetCrmLeavesData['query']>['sort_by'],
    sort_order: filters.sort_order,
  };

  return {
    filters,
    setFilters,
    updateFilter,
    searchInput,
    setSearchInput,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (page: number) => setFilters({ page }),
    pageSize: PAGE_SIZE,
    hasActiveFilters,
    clearFilters,
  };
}

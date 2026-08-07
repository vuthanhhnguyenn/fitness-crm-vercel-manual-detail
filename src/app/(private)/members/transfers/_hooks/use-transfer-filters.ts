import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmTransfersData } from '@/lib/api/types.gen';

export type TransferFilters = {
  page: number;
  search: string;
  status: string | null;
  from_store_id: string | null;
  to_store_id: string | null;
  brand: 'joyfit' | 'fit365' | null;
  applied_period: 'this_month' | 'last_month' | 'this_year' | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

export function useTransferFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(''),
      status: parseAsStringEnum([
        'pending',
        'from_store_approved',
        'approved',
        'rejected',
        'completed',
      ]),
      from_store_id: parseAsString,
      to_store_id: parseAsString,
      brand: parseAsStringEnum<'joyfit' | 'fit365'>(['joyfit', 'fit365']),
      applied_period: parseAsStringEnum<'this_month' | 'last_month' | 'this_year'>([
        'this_month',
        'last_month',
        'this_year',
      ]),
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

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const updateFilter = <K extends keyof TransferFilters>(key: K, value: TransferFilters[K]) => {
    if (key === 'sort_by' || key === 'sort_order') {
      setFilters({ [key]: value } as Parameters<typeof setFilters>[0]);
    } else {
      setFilters({ [key]: value, page: 1 } as Parameters<typeof setFilters>[0]);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      status: null,
      from_store_id: null,
      to_store_id: null,
      brand: null,
      applied_period: null,
      sort_by: 'applied_at',
      sort_order: 'desc',
    });
  };

  const activeFilterCount = [
    filters.status !== null,
    filters.from_store_id !== null,
    filters.to_store_id !== null,
    filters.brand !== null,
    filters.applied_period !== null,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || filters.search.length > 0;

  const queryParams: NonNullable<GetCrmTransfersData['query']> = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    status: (filters.status as NonNullable<GetCrmTransfersData['query']>['status']) ?? undefined,
    from_store_id: filters.from_store_id ?? undefined,
    to_store_id: filters.to_store_id ?? undefined,
    brand: (filters.brand as NonNullable<GetCrmTransfersData['query']>['brand']) ?? undefined,
    applied_period:
      (filters.applied_period as NonNullable<GetCrmTransfersData['query']>['applied_period']) ??
      undefined,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: PAGE_SIZE,
  };
}

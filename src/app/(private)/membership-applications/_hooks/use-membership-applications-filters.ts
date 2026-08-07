'use client';

import { useEffect, useState } from 'react';

import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmMembershipApplicationsData } from '@/lib/api/types.gen';

import type { MembershipApplicationStatus } from '@/types/api/membership-application.type';

const STATUS_VALUES: MembershipApplicationStatus[] = [
  'pending',
  'review',
  'approved',
  'rejected',
  'cancelled',
];
const BLACKLIST_VALUES = ['all', 'match', 'no_match'] as const;

export type MembershipApplicationsFilters = {
  page: number;
  search: string;
  status: MembershipApplicationStatus | '';
  brand: string;
  store: string;
  blacklist: 'all' | 'match' | 'no_match';
  date_from: string;
  date_to: string;
  sort_order: 'asc' | 'desc';
};

const PAGE_SIZE = 20;

export function useMembershipApplicationsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: {
        defaultValue: 1,
        parse: (v) => parseInt(v, 10) || 1,
        serialize: String,
      },
      search: parseAsString.withDefault(''),
      status: parseAsStringEnum<MembershipApplicationStatus | ''>([
        ...STATUS_VALUES,
        '' as const,
      ]).withDefault(''),
      brand: parseAsString.withDefault(''),
      store: parseAsString.withDefault(''),
      blacklist: parseAsStringEnum<'all' | 'match' | 'no_match'>([...BLACKLIST_VALUES]).withDefault(
        'all',
      ),
      date_from: parseAsString.withDefault(''),
      date_to: parseAsString.withDefault(''),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('desc'),
    },
    { history: 'push', shallow: false },
  );

  // Initialized from URL so the input reflects any pre-existing search param
  const [searchInput, setSearchInput] = useState(() => filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      status: null,
      brand: null,
      store: null,
      blacklist: null,
      date_from: null,
      date_to: null,
      sort_order: null,
    });
  };

  const hasActiveFilters =
    !!filters.search ||
    !!filters.status ||
    !!filters.brand ||
    !!filters.store ||
    filters.blacklist !== 'all' ||
    !!filters.date_from ||
    !!filters.date_to;

  const queryParams: NonNullable<GetCrmMembershipApplicationsData['query']> = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    status: (filters.status as MembershipApplicationStatus) || undefined,
    brand: filters.brand || undefined,
    store: filters.store || undefined,
    blacklist: filters.blacklist !== 'all' ? filters.blacklist : undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    sort_by: 'application_date',
    sort_order: filters.sort_order,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: PAGE_SIZE,
    toggleSortOrder: () =>
      setFilters({ sort_order: filters.sort_order === 'desc' ? 'asc' : 'desc', page: 1 }),
  };
}

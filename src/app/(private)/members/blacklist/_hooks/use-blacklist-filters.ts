import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { BlacklistRegistrationSource, UnpaidFilter } from '@/lib/api/types.gen';
import type { GetCrmBlacklistData } from '@/lib/api/types.gen';

export type BlacklistFilters = {
  page: number;
  search: string;
  reason: BlacklistRegistrationSource | null;
  unpaid: UnpaidFilter | null;
};

export function useBlacklistFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(''),
      reason: parseAsStringEnum<BlacklistRegistrationSource>(
        Object.values(BlacklistRegistrationSource),
      ),
      unpaid: parseAsStringEnum<UnpaidFilter>(Object.values(UnpaidFilter)),
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

  const updateFilter = <K extends keyof BlacklistFilters>(key: K, value: BlacklistFilters[K]) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ page: 1, search: null, reason: null, unpaid: null });
  };

  const hasActiveFilters: boolean =
    !!filters.reason || !!filters.unpaid || filters.search.length > 0;

  const queryParams: NonNullable<GetCrmBlacklistData['query']> = {
    page: String(filters.page),
    limit: String(PAGE_SIZE),
    search: filters.search || undefined,
    reason: filters.reason ?? undefined,
    unpaid: filters.unpaid ?? undefined,
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

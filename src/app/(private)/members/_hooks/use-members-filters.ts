import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';

import type { GetCrmMembersData } from '@/lib/api/types.gen';
import { Brand, ContractType, MemberStatus } from '@/lib/api/types.gen';

export type MembersFilters = {
  page: number;
  search: string;
  contract_type: ContractType[];
  status: MemberStatus[];
  brand: Brand[];
  store_id: string[];
  last_visit_days: number | null;
  has_unpaid: boolean | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

export function useMembersFilters() {
  // Use nuqs for URL query parameters
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(''),
      contract_type: parseAsArrayOf(
        parseAsStringEnum<ContractType>(Object.values(ContractType)),
      ).withDefault([]),
      status: parseAsArrayOf(
        parseAsStringEnum<MemberStatus>(Object.values(MemberStatus)),
      ).withDefault([]),
      brand: parseAsArrayOf(parseAsStringEnum<Brand>(Object.values(Brand))).withDefault([]),
      store_id: parseAsArrayOf(parseAsString).withDefault([]),
      last_visit_days: parseAsInteger,
      has_unpaid: parseAsBoolean,
      sort_by: parseAsString.withDefault('member_number'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
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

  const updateFilter = <K extends keyof MembersFilters>(key: K, value: MembersFilters[K]) => {
    const pageReset = { page: 1 } as const;
    if (key === 'contract_type' || key === 'status' || key === 'brand' || key === 'store_id') {
      const arrValue = value as string[];
      setFilters({
        [key]: arrValue.length > 0 ? arrValue : null,
        ...pageReset,
      } as Parameters<typeof setFilters>[0]);
    } else if (key === 'last_visit_days' || key === 'has_unpaid') {
      setFilters({ [key]: value ?? null, ...pageReset } as Parameters<typeof setFilters>[0]);
    } else {
      setFilters({ [key]: value, ...pageReset } as Parameters<typeof setFilters>[0]);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      contract_type: null,
      status: null,
      brand: null,
      store_id: null,
      last_visit_days: null,
      has_unpaid: null,
      sort_by: 'member_number',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters: boolean =
    filters.contract_type.length > 0 ||
    filters.status.length > 0 ||
    filters.brand.length > 0 ||
    filters.store_id.length > 0 ||
    filters.last_visit_days !== null ||
    filters.has_unpaid !== null ||
    filters.search.length > 0;

  const queryParams: NonNullable<GetCrmMembersData['query']> = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    contract_type: filters.contract_type.length > 0 ? filters.contract_type : undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    brand: filters.brand.length > 0 ? filters.brand : undefined,
    store_id: filters.store_id.length > 0 ? filters.store_id : undefined,
    last_visit_days: filters.last_visit_days ?? undefined,
    has_unpaid: filters.has_unpaid ?? undefined,
    sort_by: filters.sort_by as NonNullable<GetCrmMembersData['query']>['sort_by'],
    sort_order: filters.sort_order,
  };

  return {
    // Search input (local state for debouncing)
    searchInput,
    setSearchInput,
    // Filters from URL
    filters,
    // Update functions
    updateFilter,
    setFilters,
    clearFilters,
    // Computed
    hasActiveFilters,
    queryParams,
    // Sort helpers
    handleSortChange: (field: string, order: 'asc' | 'desc') => {
      setFilters({ sort_by: field, sort_order: order });
    },
    handleSearchExecute: () => {
      setFilters({ search: searchInput || null, page: 1 });
    },
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: PAGE_SIZE,
  };
}

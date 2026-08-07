import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmMainContractsData } from '@/lib/api/types.gen';

import {
  type CompanionBenefitFilter,
  MAIN_CONTRACT_BRAND_LABELS,
  MAIN_CONTRACT_STATUS_LABELS,
  MAIN_CONTRACT_TYPE_LABELS,
} from '../_constants/constants';

type MainContractsQuery = NonNullable<GetCrmMainContractsData['query']>;

const MAIN_CONTRACT_TYPES = Object.keys(MAIN_CONTRACT_TYPE_LABELS) as Array<
  NonNullable<MainContractsQuery['contract_type']>
>;
const MAIN_CONTRACT_BRANDS = Object.keys(MAIN_CONTRACT_BRAND_LABELS) as Array<
  NonNullable<MainContractsQuery['brand']>
>;
const MAIN_CONTRACT_STATUSES = Object.keys(MAIN_CONTRACT_STATUS_LABELS) as Array<
  NonNullable<MainContractsQuery['status']>
>;
const COMPANION_BENEFIT_FILTERS: CompanionBenefitFilter[] = ['all', 'true', 'false'];
const MAIN_CONTRACT_SORT_FIELDS = [
  'id',
  'name',
  'code',
  'contract_type',
  'start_date',
  'price_including_tax',
  'suspension_fee',
  'monthly_limit',
  'tax_rate',
  'active_contracts',
  'enabled_stores',
  'status',
] as const satisfies Array<NonNullable<MainContractsQuery['sort_by']>>;

export type ContractsFiltersState = {
  page: number;
  limit: number;
  search: string;
  contract_type: MainContractsQuery['contract_type'] | null;
  brand: MainContractsQuery['brand'] | null;
  status: MainContractsQuery['status'] | null;
  companion_benefit: CompanionBenefitFilter;
  sort_by: NonNullable<MainContractsQuery['sort_by']>;
  sort_order: NonNullable<MainContractsQuery['sort_order']>;
};

export function useContractsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      contract_type: parseAsStringEnum(MAIN_CONTRACT_TYPES),
      brand: parseAsStringEnum(MAIN_CONTRACT_BRANDS),
      status: parseAsStringEnum(MAIN_CONTRACT_STATUSES),
      companion_benefit: parseAsStringEnum(COMPANION_BENEFIT_FILTERS).withDefault('all'),
      sort_by: parseAsStringEnum(MAIN_CONTRACT_SORT_FIELDS).withDefault('id'),
      sort_order: parseAsStringEnum(['asc', 'desc']).withDefault('asc'),
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

  const updateFilter = <K extends keyof ContractsFiltersState>(
    key: K,
    value: ContractsFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 });
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      search: null,
      contract_type: null,
      brand: null,
      status: null,
      companion_benefit: 'all',
      sort_by: 'id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters: boolean =
    filters.contract_type !== null ||
    filters.brand !== null ||
    filters.status !== null ||
    filters.companion_benefit !== 'all' ||
    filters.search.length > 0;

  const queryParams: MainContractsQuery = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    contract_type: filters.contract_type || undefined,
    brand: filters.brand || undefined,
    status: filters.status || undefined,
    companion_benefit_enabled:
      filters.companion_benefit === 'all' ? undefined : filters.companion_benefit === 'true',
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextPageSize: number) => setFilters({ limit: nextPageSize, page: 1 }),
  };
}

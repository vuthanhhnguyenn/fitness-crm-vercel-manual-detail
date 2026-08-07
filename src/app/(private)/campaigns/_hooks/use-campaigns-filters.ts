import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { StoreListBrand as StoreListBrandEnum } from '@/lib/api/types.gen';
import type { GetCrmCampaignsData } from '@/lib/api/types.gen';

import { CAMPAIGN_ACCEPT_STATUS_VALUES } from '../_constants/constants';

type CampaignsQuery = NonNullable<GetCrmCampaignsData['query']>;

const CAMPAIGN_BRANDS = Object.values(StoreListBrandEnum) as NonNullable<CampaignsQuery['brand']>[];
const CAMPAIGN_SORT_FIELDS = [
  'id',
  'name',
  'code',
  'brand',
  'recruitment_period_start',
  'recruitment_period_end',
  'accept_status',
  'main_contract_name',
] as const satisfies Array<NonNullable<CampaignsQuery['sort_by']>>;

export type CampaignsFiltersState = {
  page: number;
  limit: number;
  search: string;
  brand: CampaignsQuery['brand'] | null;
  accept_status: CampaignsQuery['accept_status'] | null;
  recruitment_period_start: string;
  recruitment_period_end: string;
  sort_by: NonNullable<CampaignsQuery['sort_by']>;
  sort_order: NonNullable<CampaignsQuery['sort_order']>;
};

export function useCampaignsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      brand: parseAsStringEnum(CAMPAIGN_BRANDS),
      accept_status: parseAsStringEnum([...CAMPAIGN_ACCEPT_STATUS_VALUES]),
      recruitment_period_start: parseAsString.withDefault(''),
      recruitment_period_end: parseAsString.withDefault(''),
      sort_by: parseAsStringEnum([...CAMPAIGN_SORT_FIELDS]).withDefault('id'),
      sort_order: parseAsStringEnum(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const [searchInput, setSearchInput] = useState(() => filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const updateFilter = <K extends keyof CampaignsFiltersState>(
    key: K,
    value: CampaignsFiltersState[K],
  ) => {
    setFilters({ [key]: value === '' ? null : (value ?? null), page: 1 } as Parameters<
      typeof setFilters
    >[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      search: null,
      brand: null,
      accept_status: null,
      recruitment_period_start: null,
      recruitment_period_end: null,
      sort_by: 'id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters: boolean =
    filters.brand !== null ||
    filters.accept_status !== null ||
    filters.recruitment_period_start.length > 0 ||
    filters.recruitment_period_end.length > 0 ||
    filters.search.length > 0;

  const queryParams: CampaignsQuery = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    brand: filters.brand || undefined,
    accept_status: filters.accept_status || undefined,
    recruitment_period_start: filters.recruitment_period_start || undefined,
    recruitment_period_end: filters.recruitment_period_end || undefined,
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

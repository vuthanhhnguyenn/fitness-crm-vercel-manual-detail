import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type {
  FranchiseCompanyStatus,
  FranchiseCompanyType,
  GetFranchiseCompaniesQuery,
} from '@/lib/api/types.gen';

import {
  FRANCHISE_COMPANY_STATUS_VALUES,
  FRANCHISE_COMPANY_TYPE_VALUES,
} from '../_constants/constants';

export type FranchiseCompaniesFiltersState = {
  page: number;
  limit: number;
  search: string;
  company_type: FranchiseCompanyType | null;
  status: FranchiseCompanyStatus | null;
  sort_by: GetFranchiseCompaniesQuery['sort_by'];
  sort_order: GetFranchiseCompaniesQuery['sort_order'];
};

export function useFranchiseCompaniesFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      company_type: parseAsStringEnum<FranchiseCompanyType>([...FRANCHISE_COMPANY_TYPE_VALUES]),
      status: parseAsStringEnum<FranchiseCompanyStatus>([...FRANCHISE_COMPANY_STATUS_VALUES]),
      sort_by: parseAsStringEnum<NonNullable<GetFranchiseCompaniesQuery['sort_by']>>([
        'id',
        'display_name',
      ]).withDefault('id'),
      sort_order: parseAsStringEnum<NonNullable<GetFranchiseCompaniesQuery['sort_order']>>([
        'asc',
        'desc',
      ]).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const updateFilter = <K extends keyof FranchiseCompaniesFiltersState>(
    key: K,
    value: FranchiseCompaniesFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      search: null,
      company_type: null,
      status: null,
      sort_by: 'id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters =
    filters.search.length > 0 || filters.company_type !== null || filters.status !== null;

  const queryParams: NonNullable<GetFranchiseCompaniesQuery> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    company_type: filters.company_type || undefined,
    status: filters.status || undefined,
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
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}

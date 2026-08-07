import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import {
  type GetCrmLockersContractsData,
  LockerContractStatus,
  type LockerContractStatus as LockerContractStatusValue,
  LockerOptionType,
  type LockerOptionType as LockerOptionTypeValue,
  type PostCrmLockersContractsExportData,
} from '@/lib/api/types.gen';

type LockerContractsSortBy = NonNullable<GetCrmLockersContractsData['query']>['sort_by'];

export function useLockerContractsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      locker_contracts_page: parseAsInteger.withDefault(1),
      locker_contracts_search: parseAsString.withDefault(''),
      locker_contracts_type: parseAsStringEnum<LockerOptionTypeValue>(
        Object.values(LockerOptionType),
      ),
      locker_contracts_status: parseAsStringEnum<LockerContractStatusValue>(
        Object.values(LockerContractStatus),
      ),
      locker_contracts_sort_by: parseAsString.withDefault('contract_id'),
      locker_contracts_sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault(
        'asc',
      ),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const [searchInput, setSearchInput] = useState(() => filters.locker_contracts_search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.locker_contracts_search) {
        setFilters({ locker_contracts_search: searchInput || null, locker_contracts_page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.locker_contracts_search, searchInput, setFilters]);

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      locker_contracts_page: 1,
      locker_contracts_search: null,
      locker_contracts_type: null,
      locker_contracts_status: null,
      locker_contracts_sort_by: 'contract_id',
      locker_contracts_sort_order: 'asc',
    });
  };

  const queryParams: NonNullable<GetCrmLockersContractsData['query']> = {
    page: filters.locker_contracts_page,
    limit: PAGE_SIZE,
    search: filters.locker_contracts_search || undefined,
    contract_type: filters.locker_contracts_type || undefined,
    status: filters.locker_contracts_status || undefined,
    sort_by: filters.locker_contracts_sort_by as LockerContractsSortBy,
    sort_order: filters.locker_contracts_sort_order,
  };

  const exportQueryParams: NonNullable<PostCrmLockersContractsExportData['body']> = {
    search: filters.locker_contracts_search || undefined,
    contract_type: filters.locker_contracts_type || undefined,
    status: filters.locker_contracts_status || undefined,
    sort_by: filters.locker_contracts_sort_by as LockerContractsSortBy,
    sort_order: filters.locker_contracts_sort_order,
  };

  return {
    filters,
    queryParams,
    exportQueryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    currentPage: filters.locker_contracts_page,
    setCurrentPage: (page: number) => setFilters({ locker_contracts_page: page }),
    pageSize: PAGE_SIZE,
    hasActiveFilters:
      filters.locker_contracts_type !== null ||
      filters.locker_contracts_status !== null ||
      filters.locker_contracts_search.length > 0,
    activeFilterCount: [
      filters.locker_contracts_type !== null,
      filters.locker_contracts_status !== null,
    ].filter(Boolean).length,
  };
}

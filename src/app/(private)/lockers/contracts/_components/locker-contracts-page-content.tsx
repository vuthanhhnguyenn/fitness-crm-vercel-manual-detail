'use client';

import { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Card } from '@/components/ui/card';

import { getCrmLockersContractsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  LOCKER_CONTRACT_STATUS_LABELS,
  LOCKER_OPTION_TYPE_LABELS,
} from '../../_constants/constants';
import { useQueryErrorToast } from '../../_hooks/use-query-error-toast.hook';
import { useLockerContractsFilters } from '../_hooks/use-locker-contracts-filters';
import { LockerContractsFilters } from './locker-contracts-filters';
import { getLockerContractsTableColumns } from './locker-contracts-table-columns';

export function LockerContractsPageContent() {
  const router = useRouter();
  const {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    hasActiveFilters,
  } = useLockerContractsFilters();

  const { data, isLoading, isFetching, isError } = useQuery({
    ...getCrmLockersContractsOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  useQueryErrorToast(isError, '契約一覧の取得に失敗しました');

  const contracts = useMemo(() => data?.contracts ?? [], [data?.contracts]);
  const pagination = data?.pagination;
  const totalContracts = pagination?.all_total ?? 0;
  const filteredTotal = pagination?.total ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = filters.locker_contracts_sort_by
    ? [
        {
          id: filters.locker_contracts_sort_by,
          desc: filters.locker_contracts_sort_order === 'desc',
        },
      ]
    : [];

  const columns = useMemo(() => getLockerContractsTableColumns(), []);

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ locker_contracts_sort_by: null, locker_contracts_sort_order: null });
      return;
    }

    setFilters({
      locker_contracts_sort_by: next[0]?.id ?? 'contract_id',
      locker_contracts_sort_order: next[0]?.desc ? 'desc' : 'asc',
    });
  };

  return (
    <Card className="flex gap-0 overflow-hidden rounded-xl border p-0">
      <div className="px-4 py-3">
        <LockerContractsFilters
          filters={filters}
          searchInput={searchInput}
          setFilters={setFilters}
          setSearchInput={setSearchInput}
        />
      </div>

      <FilterResultBanner
        show={hasActiveFilters}
        totalCount={totalContracts}
        filteredCount={filteredTotal}
        filterSummary={[
          filters.locker_contracts_search ? `"${filters.locker_contracts_search}"` : '',
          filters.locker_contracts_status
            ? LOCKER_CONTRACT_STATUS_LABELS[filters.locker_contracts_status]
            : '',
          filters.locker_contracts_type
            ? LOCKER_OPTION_TYPE_LABELS[filters.locker_contracts_type]
            : '',
        ]}
        onClear={clearFilters}
      />

      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        isFetching={isFetching}
        variant="simple"
        className="rounded-none border-x-0 border-b-0"
        containerClassName="max-h-[calc(100vh-300px)]"
        onRowClick={(row) => router.push(navigate('/lockers/contracts/[id]', row.id))}
        emptyContent={
          <Empty
            variant={hasActiveFilters ? 'filtered' : 'empty'}
            entityLabel="契約"
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        }
        tableOptions={{
          manualSorting: true,
          onSortingChange: handleSortingChange,
          state: { sorting },
        }}
      />

      <TablePaginationWithSize
        currentPage={page}
        total={filteredTotal}
        pageSize={limit}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </Card>
  );
}

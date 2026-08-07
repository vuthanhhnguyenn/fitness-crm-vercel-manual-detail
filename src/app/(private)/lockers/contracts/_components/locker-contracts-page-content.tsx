'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Card } from '@/components/ui/card';

import { getCrmLockersContractsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { useLockerContractsFilters } from '../_hooks/use-locker-contracts-filters';
import { LockerContractsFilters } from './locker-contracts-filters';
import { getLockerContractsTableColumns } from './locker-contracts-table-columns';

export function LockerContractsPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
    hasActiveFilters,
    activeFilterCount,
  } = useLockerContractsFilters();

  const { data, isLoading } = useQuery({
    ...getCrmLockersContractsOptions({
      query: queryParams,
    }),
  });

  const contracts = data?.contracts ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
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
    <Card className="gap-3 overflow-hidden rounded-xl border p-0">
      <div className="p-3 pb-0">
        <LockerContractsFilters
          activeFilterCount={activeFilterCount}
          clearFilters={clearFilters}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          isFilterOpen={isFilterOpen}
          searchInput={searchInput}
          setFilters={setFilters}
          setIsFilterOpen={setIsFilterOpen}
          setSearchInput={setSearchInput}
        />
      </div>

      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        variant="simple"
        className="rounded-none border-x-0 border-b-0"
        containerClassName={
          isFilterOpen ? 'max-h-[calc(100vh-320px)]' : 'max-h-[calc(100vh-270px)]'
        }
        onRowClick={(row) => router.push(navigate('/lockers/contracts/[id]', row.id))}
        tableOptions={{
          manualSorting: true,
          onSortingChange: handleSortingChange,
          state: { sorting },
        }}
      />

      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />
    </Card>
  );
}

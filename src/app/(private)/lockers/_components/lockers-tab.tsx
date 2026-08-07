'use client';

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Card } from '@/components/ui/card';

import { getCrmLockersOptions } from '@/lib/api/@tanstack/react-query.gen';

import { useLockersFilters } from '../_hooks/use-lockers-filters';
import { LockersFilters } from './lockers-filters';
import { getLockersTableColumns } from './lockers-table-columns';

export function LockersTab() {
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
  } = useLockersFilters();

  const { data, isLoading } = useQuery({
    ...getCrmLockersOptions({
      query: queryParams,
    }),
  });

  const lockers = data?.lockers ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = filters.lockers_sort_by
    ? [{ id: filters.lockers_sort_by, desc: filters.lockers_sort_order === 'desc' }]
    : [];

  const columns = useMemo(() => getLockersTableColumns(), []);

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ lockers_sort_by: null, lockers_sort_order: null });
      return;
    }

    setFilters({
      lockers_sort_by: next[0]?.id ?? 'locker_id',
      lockers_sort_order: next[0]?.desc ? 'desc' : 'asc',
    });
  };

  return (
    <Card className="gap-3 overflow-hidden rounded-xl border p-0">
      <div className="p-3 pb-0">
        <LockersFilters
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
        data={lockers}
        isLoading={isLoading}
        variant="simple"
        className="rounded-none border-x-0 border-b-0"
        containerClassName={
          isFilterOpen ? 'max-h-[calc(100vh-360px)]' : 'max-h-[calc(100vh-310px)]'
        }
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

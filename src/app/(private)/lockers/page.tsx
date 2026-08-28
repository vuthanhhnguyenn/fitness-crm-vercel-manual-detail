'use client';

import { Suspense, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Card } from '@/components/ui/card';

import { getCrmLockersOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LockersFilters } from './_components/lockers-filters';
import { getLockersTableColumns } from './_components/lockers-table-columns';
import { LOCKER_SHAPE_LABELS } from './_constants/constants';
import { useLockersFilters } from './_hooks/use-lockers-filters';
import { useQueryErrorToast } from './_hooks/use-query-error-toast.hook';

function LockersPageContent() {
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
  } = useLockersFilters();

  const { data, isLoading, isFetching, isError } = useQuery({
    ...getCrmLockersOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  useQueryErrorToast(isError, 'ロッカー一覧の取得に失敗しました');

  const lockers = useMemo(() => data?.lockers ?? [], [data?.lockers]);
  const pagination = data?.pagination;
  const totalLockers = pagination?.all_total ?? 0;
  const filteredTotal = pagination?.total ?? 0;
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
    <Card className="flex gap-0 overflow-hidden rounded-xl border p-0">
      <div className="px-4 py-3">
        <LockersFilters
          filters={filters}
          searchInput={searchInput}
          setFilters={setFilters}
          setSearchInput={setSearchInput}
        />
      </div>

      <FilterResultBanner
        show={hasActiveFilters}
        totalCount={totalLockers}
        filteredCount={filteredTotal}
        filterSummary={[
          filters.lockers_search ? `"${filters.lockers_search}"` : '',
          filters.lockers_shape ? LOCKER_SHAPE_LABELS[filters.lockers_shape] : '',
        ]}
        onClear={clearFilters}
      />

      <DataTable
        columns={columns}
        data={lockers}
        isLoading={isLoading}
        isFetching={isFetching}
        variant="simple"
        className="rounded-none border-x-0 border-b-0"
        containerClassName="max-h-[calc(100vh-300px)]"
        onRowClick={(row) => router.push(navigate('/lockers/[id]', row.id))}
        emptyContent={
          <Empty
            variant={hasActiveFilters ? 'filtered' : 'empty'}
            entityLabel="ロッカー"
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

export default function LockersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LockersPageContent />
    </Suspense>
  );
}

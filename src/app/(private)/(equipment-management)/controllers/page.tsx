'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getCrmControllersOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ControllerFilters } from './_components/controller-filters';
import { getControllerTableColumns } from './_components/controller-table-columns';
import { useControllerFilters } from './_hooks/use-controller-filters';

function ControllersPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const {
    activeFilterCount,
    clearFilterSelects,
    clearFilters,
    currentPage,
    filters,
    hasActiveFilters,
    pageSize,
    queryParams,
    searchInput,
    setCurrentPage,
    setFilters,
    setPageSize,
    setSearchInput,
  } = useControllerFilters();

  const sorting: SortingState = filters.controller_sort_by
    ? [{ id: filters.controller_sort_by, desc: filters.controller_sort_order === 'desc' }]
    : [];

  const { data, isLoading } = useQuery({
    ...getCrmControllersOptions({ query: queryParams }),
  });

  const columns = useMemo(() => getControllerTableColumns(), []);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? currentPage;
  const limit = data?.limit ?? pageSize;
  const isFilteredEmpty = hasActiveFilters && !isLoading && total === 0;

  return (
    <div className="space-y-4">
      <Card className="gap-3 overflow-hidden rounded-xl border p-0">
        <div className="p-3 pb-0">
          <ControllerFilters
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            status={filters.controller_status}
            onStatusChange={(status) =>
              setFilters({ controller_status: status, controller_page: 1 })
            }
            activeFilterCount={activeFilterCount}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            hasActiveFilters={hasActiveFilters || activeFilterCount > 0}
            clearFilters={clearFilters}
            clearFilterSelects={clearFilterSelects}
            total={total}
          />
        </div>

        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          variant="simple"
          className="rounded-none border-x-0 border-b-0"
          containerClassName="max-h-[calc(100vh-330px)]"
          onRowClick={(row) => router.push(navigate('/controllers/[id]', row.controller_id))}
          emptyContent={
            isFilteredEmpty ? (
              <div className="flex min-h-60 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  条件に一致する接点制御装置がありません
                </p>
                <Button variant="outline" size="sm" className="text-xs" onClick={clearFilters}>
                  条件をクリア
                </Button>
              </div>
            ) : undefined
          }
          getRowClassName={(row) =>
            row.status === 'error'
              ? 'bg-destructive/10 shadow-[inset_4px_0_0_0_var(--destructive)]'
              : undefined
          }
          tableOptions={{
            manualSorting: true,
            getRowId: (originalRow) => originalRow.controller_id,
            onSortingChange: (updater) => {
              const next = typeof updater === 'function' ? updater(sorting) : updater;

              if (next.length === 0) {
                setFilters({
                  controller_sort_by: 'controller_id',
                  controller_sort_order: 'asc',
                  controller_page: 1,
                });
                return;
              }

              setFilters({
                controller_sort_by: next[0]?.id as NonNullable<typeof filters.controller_sort_by>,
                controller_sort_order: next[0]?.desc ? 'desc' : 'asc',
                controller_page: 1,
              });
            },
            state: { sorting },
          }}
        />

        {total > 0 && (
          <TablePaginationWithSize
            total={total}
            currentPage={page}
            pageSize={limit}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>
    </div>
  );
}

export default function ControllersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ControllersPageContent />
    </Suspense>
  );
}

'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmLeavesOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLeavesResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LeavesCancelDialog } from './_components/leaves-cancel-dialog';
import { LeavesFilters } from './_components/leaves-filters';
import { LeavesTableColumns } from './_components/leaves-table-columns';
import { LEAVE_PAGE_SIZE_OPTIONS } from './_constants/constants';
import { LeavesFiltersProvider } from './_contexts/leaves-filters-context';
import { useLeavesFilters } from './_hooks/use-leaves-filters.hook';

type LeaveRow = NonNullable<GetCrmLeavesResponse['leaves']>[number];

function LeavesPageContent() {
  const router = useRouter();
  const { currentStoreId } = useCurrentStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LeaveRow | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtersHook = useLeavesFilters();
  const { queryParams, currentPage, setCurrentPage, pageSize, setPageSize } = filtersHook;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...getCrmLeavesOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  const leaves = data?.leaves ?? [];
  const total = data?.total ?? 0;
  // FR-024 — the banner's denominator: the store scope before any in-screen filter.
  const totalAll = data?.total_all ?? 0;

  /**
   * FR-034 — the handler clamps an over-range page and answers with the page it actually
   * served. Mirroring that back into the URL keeps the pagination control from highlighting
   * a page that does not exist (e.g. after rows leave the filtered set).
   *
   * Two guards matter here. `isFetching` excludes the window where `keepPreviousData` is
   * still showing the *previous* query's response — its page belongs to the old filter and
   * would otherwise be written back over the reset to page 1. And only a clamp is followed
   * (`servedPage < currentPage`); the handler never serves a page beyond the one requested.
   */
  const servedPage = data?.page;
  useEffect(() => {
    if (!isFetching && servedPage !== undefined && servedPage < currentPage) {
      setCurrentPage(servedPage);
    }
  }, [isFetching, servedPage, currentPage, setCurrentPage]);

  const showStoreColumn = currentStoreId === ALL_STORES;
  const columns = LeavesTableColumns({ showStoreColumn, onCancelClick: setCancelTarget });

  // FR-033 — a page change returns the operator to the top of the table body.
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollRef.current
      ?.querySelector('[data-slot="table-container"]')
      ?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LeavesFiltersProvider value={filtersHook}>
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          title="休会・退会管理"
          badge={
            <Badge
              variant="outline"
              className="text-muted-foreground text-xs font-normal tabular-nums"
            >
              {total.toLocaleString()}件
            </Badge>
          }
        />

        <div ref={scrollRef} className="bg-muted/40 flex min-h-0 flex-1 flex-col overflow-auto p-6">
          <Card className="gap-0 overflow-hidden py-0">
            <LeavesFilters
              isFilterOpen={isFilterOpen}
              onFilterOpenChange={setIsFilterOpen}
              totalAll={totalAll}
              total={total}
            />

            <DataTable
              columns={columns}
              data={leaves}
              isLoading={isLoading}
              isFetching={isFetching}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={
                isFilterOpen ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-280px)]'
              }
              onRowClick={(row) => router.push(navigate('/members/leaves/[id]', row.id))}
              emptyContent={
                isError ? (
                  <Empty
                    icon={AlertCircle}
                    title="休会・退会一覧の取得に失敗しました"
                    description="通信状況をご確認のうえ、再度お試しください。"
                    actionLabel="再読み込み"
                    onAction={() => void refetch()}
                  />
                ) : (
                  <Empty
                    variant={filtersHook.hasActiveFilters ? 'filtered' : 'empty'}
                    entityLabel="休会・退会"
                    onAction={filtersHook.hasActiveFilters ? filtersHook.clearFilters : undefined}
                  />
                )
              }
            />

            {leaves.length > 0 && (
              <TablePaginationWithSize
                currentPage={currentPage}
                total={total}
                pageSize={pageSize}
                pageSizeOptions={LEAVE_PAGE_SIZE_OPTIONS}
                onPageChange={handlePageChange}
                onPageSizeChange={setPageSize}
              />
            )}
          </Card>
        </div>
      </div>

      <LeavesCancelDialog
        target={cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      />
    </LeavesFiltersProvider>
  );
}

export default function LeavesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LeavesPageContent />
    </Suspense>
  );
}

'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, Plus } from 'lucide-react';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getCrmBlacklistOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BlacklistFilters } from './_components/blacklist-filters';
import { BlacklistRegisterSheet } from './_components/blacklist-register-sheet';
import { BlacklistTableColumns } from './_components/blacklist-table-columns';
import { BlacklistFiltersProvider } from './_contexts/blacklist-filters-context';
import { useBlacklistFilters } from './_hooks/use-blacklist-filters.hook';

function BlacklistPageContent() {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtersHook = useBlacklistFilters();
  const { queryParams, currentPage, setCurrentPage, pageSize, setPageSize, pageSizeOptions } =
    filtersHook;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...getCrmBlacklistOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  const blacklist = data?.blacklist ?? [];
  const total = data?.total ?? 0;
  // FR-025 — the banner's denominator: active entries before any in-screen filter.
  const totalAll = data?.total_all ?? total;

  /**
   * The handler clamps an over-range page and answers with the page it actually served.
   * Mirroring that back into the URL stops the pagination control from highlighting a page
   * that no longer exists — e.g. after a filter shrinks the result while the operator is
   * on the last page.
   *
   * `isFetching` excludes the window where `keepPreviousData` is still showing the previous
   * query's response, whose page belongs to the old filter. Only a clamp is followed
   * (`servedPage < currentPage`); the handler never serves a page beyond the one requested.
   */
  const servedPage = data?.page;
  useEffect(() => {
    if (!isFetching && servedPage !== undefined && servedPage < currentPage) {
      setCurrentPage(servedPage);
    }
  }, [isFetching, servedPage, currentPage, setCurrentPage]);

  const columns = BlacklistTableColumns();

  // FR-031 — a page change returns the operator to the top of the table body.
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollRef.current
      ?.querySelector('[data-slot="table-container"]')
      ?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <BlacklistFiltersProvider value={filtersHook}>
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          title="ブラックリスト管理"
          // FR-005 — the badge counts the *filtered* rows, not the scoped total.
          badge={
            <Badge
              variant="outline"
              className="text-muted-foreground text-xs font-normal tabular-nums"
            >
              {total.toLocaleString()}件
            </Badge>
          }
          actions={
            // FR-034 — the Sheet trigger. The whole screen is HQ-only, so no extra gate here.
            <Button size="sm" onClick={() => setIsSheetOpen(true)}>
              <Plus className="size-4" />
              手動登録
            </Button>
          }
        />

        <div ref={scrollRef} className="bg-muted/40 flex min-h-0 flex-1 flex-col overflow-auto p-6">
          <Card className="gap-0 overflow-hidden py-0">
            <BlacklistFilters totalAll={totalAll} total={total} />

            <DataTable
              columns={columns}
              data={blacklist}
              isLoading={isLoading}
              isFetching={isFetching}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName="max-h-[calc(100vh-280px)]"
              onRowClick={(row) => router.push(navigate('/members/blacklist/[id]', row.id))}
              emptyContent={
                isError ? (
                  // FR-071 — a failed load says so and offers a retry, rather than reading
                  // as "there are no blacklisted members".
                  <Empty
                    icon={AlertCircle}
                    title="ブラックリストの取得に失敗しました"
                    description="通信状況をご確認のうえ、再度お試しください。"
                    actionLabel="再読み込み"
                    onAction={() => void refetch()}
                  />
                ) : (
                  // FR-026 / FR-027 — filtered vs blank-slate are different messages, and only
                  // the filtered one offers 条件をクリア.
                  <Empty
                    variant={filtersHook.hasActiveFilters ? 'filtered' : 'empty'}
                    entityLabel="ブラックリスト"
                    onAction={filtersHook.hasActiveFilters ? filtersHook.clearFilters : undefined}
                  />
                )
              }
            />

            {blacklist.length > 0 && (
              <TablePaginationWithSize
                currentPage={currentPage}
                total={total}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageChange={handlePageChange}
                onPageSizeChange={setPageSize}
              />
            )}
          </Card>
        </div>
      </div>

      <BlacklistRegisterSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </BlacklistFiltersProvider>
  );
}

export default function BlacklistPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BlacklistPageContent />
    </Suspense>
  );
}

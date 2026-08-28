'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { BRAND_LABELS } from '@/app/(private)/brands/_constants/brand.constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResult } from '@/components/common/filter-result';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmBannersByIdMutation,
  getCrmBannersOptions,
  getCrmBannersQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { BannerItemResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BannerDeleteDialog } from './_components/banner-delete-dialog';
import { BannerListHeaderActions } from './_components/banner-list-header-actions';
import { BannerOrderDialog } from './_components/banner-order-dialog';
import { BannersFilters } from './_components/banners-filters';
import { BannersTableColumns } from './_components/banners-table-columns';
import {
  BANNER_CHANNEL_LABELS,
  BANNER_STATUS_LABELS,
  getTableMaxHeightClass,
} from './_constants/banner.constants';
import { useBannersFilters } from './_hooks/use-banners-filters';

function BannersPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderDialogKey, setOrderDialogKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BannerItemResponse | null>(null);
  const filtersHook = useBannersFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmBannersOptions({ query: queryParams }),
  });

  const { data: allBannersData } = useQuery({
    ...getCrmBannersOptions({
      query: { sort: 'order', order: 'asc' },
    }),
    enabled: orderDialogOpen,
  });

  const banners = data?.items ?? [];
  const allBanners = allBannersData?.items ?? [];
  const pagination = data?.pagination;
  const totalBanners = pagination?.totalItems ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const deleteMutation = useMutation({
    ...deleteCrmBannersByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'バナーを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmBannersQueryKey() });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('バナーの削除に失敗しました');
    },
  });

  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort: 'order', order: 'asc' });
      return;
    }

    setFilters({
      sort: next[0].id as typeof filters.sort,
      order: next[0].desc ? 'desc' : 'asc',
    });
  };

  const columns: ColumnDef<BannerItemResponse>[] = useMemo(
    () =>
      BannersTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/banners/[id]/edit', id));
        },
        onDeleteClick: (banner) => {
          setDeleteTarget(banner);
        },
      }),
    [router],
  );

  return (
    <>
      <PageHeader
        title="バナー管理"
        className="[&_h1]:text-[18px] [&_h1]:leading-7"
        badge={
          <Badge
            variant="outline"
            className="text-muted-foreground text-xs font-normal tabular-nums"
          >
            {totalBanners.toLocaleString()}件
          </Badge>
        }
        actions={
          <BannerListHeaderActions
            onOrderClick={() => {
              setOrderDialogKey((k) => k + 1);
              setOrderDialogOpen(true);
            }}
          />
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
        {filtersHook.hasActiveFilters && (
          <FilterResult
            totalCount={totalBanners}
            filteredCount={totalBanners}
            filterSummary={[
              filters.query ? `"${filters.query}"` : '',
              filters.brandEnum ? (BRAND_LABELS[filters.brandEnum] ?? filters.brandEnum) : '',
              filters.channel ? (BANNER_CHANNEL_LABELS[filters.channel] ?? filters.channel) : '',
              filters.status ? (BANNER_STATUS_LABELS[filters.status] ?? filters.status) : '',
            ]}
            onClear={filtersHook.clearFilters}
            className="mt-0 mb-0"
          />
        )}
        <Card className="gap-0 overflow-hidden rounded-xl border p-0">
          <BannersFilters
            isFilterOpen={isFilterOpen}
            onFilterOpenChange={setIsFilterOpen}
            filtersHook={filtersHook}
          />

          <DataStateBoundary
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && banners.length === 0}
            onRetry={() => refetch()}
            errorTitle="バナー一覧の取得に失敗しました"
            emptyState={{
              variant: filtersHook.hasActiveFilters ? 'filtered' : 'empty',
              entityLabel: 'バナー',
              onAction: filtersHook.hasActiveFilters ? filtersHook.clearFilters : undefined,
            }}
            skeleton={
              <DataTable
                tableSize="md"
                columns={columns}
                data={[]}
                isLoading
                variant="simple"
                className="rounded-none border-x-0 border-b-0"
                containerClassName={getTableMaxHeightClass(
                  isFilterOpen,
                  filtersHook.hasActiveFilters,
                )}
              />
            }
          >
            <DataTable
              tableSize="md"
              columns={columns}
              data={banners}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={getTableMaxHeightClass(
                isFilterOpen,
                filtersHook.hasActiveFilters,
              )}
              onRowClick={() => {}}
              tableOptions={{
                onSortingChange: handleSortingChange,
                manualSorting: true,
                state: { sorting },
              }}
            />
          </DataStateBoundary>

          {totalBanners > 0 && !isError && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalBanners}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <BannerOrderDialog
        key={orderDialogKey}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        banners={allBanners}
      />

      <BannerDeleteDialog
        banner={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({ path: { id: deleteTarget.id } });
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

export default function BannersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BannersPageContent />
    </Suspense>
  );
}

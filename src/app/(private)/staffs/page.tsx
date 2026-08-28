'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Card } from '@/components/ui/card';

import {
  getCrmPositionsOptions,
  getCrmStaffsOptions,
  getCrmStaffsQueryKey,
  getCrmStoresOptions,
  postCrmStaffsByIdResendInviteMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStaffsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

import { StaffsFilters } from './_components/staffs-filters';
import { StaffsTableColumns } from './_components/staffs-table-columns';
import { STAFF_ROLE_LABELS, STAFF_STATUS_LABELS } from './_constants/constants';
import { StaffsFiltersProvider } from './_contexts/staffs-filters-context';
import { useStaffsFilters } from './_hooks/use-staffs-filters';

type Staff = GetCrmStaffsResponse['staffs'][number];

function StaffsPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filtersHook = useStaffsFilters();
  const {
    filters,
    setFilters,
    updateFilter,
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = filtersHook;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentStoreId } = useCurrentStore();
  const isSingleStoreContext = currentStoreId !== ALL_STORES;
  const headerStoreId = isSingleStoreContext ? currentStoreId : undefined;
  const hasActiveFilterOrSearch = filtersHook.hasActiveFilters;

  const resendInviteMutation = useMutation({
    ...postCrmStaffsByIdResendInviteMutation(),
    onError: () => {
      toast.error('招待の再送に失敗しました');
    },
  });

  const handleResendInvite = (staffId: string, email: string) => {
    resendInviteMutation.mutate(
      { path: { id: staffId } },
      {
        onSuccess: () => {
          toast.success('招待メールを再送しました', {
            description: `${email} に招待メールを再送信しました。`,
          });
          queryClient.invalidateQueries({ queryKey: getCrmStaffsQueryKey() });
        },
      },
    );
  };

  // Baseline count (role-scoped, no search/filter) — powers the FilterResultBanner's "全N件中" text
  const { data: baselineData } = useQuery({
    ...getCrmStaffsOptions({ query: { page: 1, limit: 1, store_id: headerStoreId } }),
    enabled: hasActiveFilterOrSearch,
  });

  // ─── Fetch staffs list ─────────────────────────────────────────────────────
  // `store_id` from the header context (single-store scope) takes precedence over the
  // advanced-filter's own store select, which is hidden whenever the header is narrowed.

  const { data, isLoading } = useQuery({
    ...getCrmStaffsOptions({
      query: { ...queryParams, store_id: headerStoreId ?? queryParams.store_id },
    }),
  });

  // Labels for the FilterResultBanner's 職位/店舗 condition text (BUG-Y01LIST-02)
  const { data: positionsForBanner } = useQuery({
    ...getCrmPositionsOptions(),
    enabled: filters.position_id != null,
  });
  const positionBannerLabel = positionsForBanner?.items.find(
    (p) => p.id === filters.position_id,
  )?.position_name;

  const { data: storesForBanner } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' } }),
    enabled: filters.store_id != null,
  });
  const storeBannerLabel = storesForBanner?.stores.find((s) => s.id === filters.store_id)?.name;

  const staffs = data?.staffs ?? [];
  const pagination = data?.pagination;
  const totalStaffs = pagination?.total ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  // ─── Sorting ───────────────────────────────────────────────────────────────

  const sorting: SortingState = filters.sort_by
    ? [{ id: filters.sort_by, desc: filters.sort_order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort_by: null, sort_order: null, page: 1 });
    } else {
      setFilters({ sort_by: next[0].id, sort_order: next[0].desc ? 'desc' : 'asc', page: 1 });
    }
  };

  // ─── Columns ───────────────────────────────────────────────────────────────

  const handlePositionClick = (positionId: number) => {
    updateFilter('position_id', positionId);
    setIsFilterOpen(true);
  };

  const columns: ColumnDef<Staff>[] = useMemo(
    () =>
      StaffsTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/staffs/[id]/edit', id));
        },
        onPositionClick: handlePositionClick,
        onResendInvite: handleResendInvite,
        isSingleStoreContext,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSingleStoreContext],
  );

  return (
    <div className="">
      {/* Header Section */}
      <div className="flex flex-col gap-3 px-4 py-4 pb-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">スタッフ管理</h1>
          <span className="text-muted-foreground text-sm">{totalStaffs}件</span>
        </div>
        <RoleGatedButton
          allowedRoles={[UserRole.Headquarter, UserRole.System]}
          className="w-full gap-2 sm:w-auto"
          onClick={() => router.push(navigate('/staffs/create'))}
        >
          <Plus className="size-4" />
          スタッフを追加
        </RoleGatedButton>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Filters + Table in one Card */}
        <Card className="gap-0! overflow-hidden rounded-xl border p-0 shadow-sm">
          {/* Filters */}
          <div className="p-3">
            <StaffsFiltersProvider value={filtersHook}>
              <StaffsFilters
                isFilterOpen={isFilterOpen}
                onFilterOpenChange={setIsFilterOpen}
                isSingleStoreContext={isSingleStoreContext}
              />
            </StaffsFiltersProvider>
          </div>

          <FilterResultBanner
            show={hasActiveFilterOrSearch}
            totalCount={baselineData?.pagination.total ?? totalStaffs}
            filteredCount={totalStaffs}
            filterSummary={[
              filters.search && `"${filters.search}"`,
              filters.role && `ロール: ${STAFF_ROLE_LABELS[filters.role]}`,
              filters.position_id != null && positionBannerLabel && `職位: ${positionBannerLabel}`,
              filters.store_id && storeBannerLabel && `店舗: ${storeBannerLabel}`,
              filters.status && `ステータス: ${STAFF_STATUS_LABELS[filters.status]}`,
            ].filter((v): v is string => Boolean(v))}
            onClear={filtersHook.clearFilters}
          />

          {/* Table */}
          <DataTable
            columns={columns}
            data={staffs}
            isLoading={isLoading}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: {
                sorting,
              },
            }}
            onRowClick={(row) => {
              router.push(navigate('/staffs/[id]', row.id));
            }}
            emptyContent={
              <Empty
                variant={hasActiveFilterOrSearch ? 'filtered' : 'empty'}
                entityLabel="スタッフ"
                onAction={hasActiveFilterOrSearch ? filtersHook.clearFilters : undefined}
              />
            }
          />

          {/* Pagination */}
          <TablePaginationWithSize
            total={totalStaffs}
            currentPage={page}
            pageSize={limit}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100, 200]}
          />
        </Card>
      </div>
    </div>
  );
}

export default function StaffsPage() {
  return (
    <Suspense>
      <StaffsPageContent />
    </Suspense>
  );
}

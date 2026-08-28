'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { appMaintenanceColumns } from '@/app/(private)/app-maintenance/_components/app-maintenance-columns';
import { AppMaintenanceDeleteDialog } from '@/app/(private)/app-maintenance/_components/app-maintenance-delete-dialog';
import { AppMaintenanceFilters } from '@/app/(private)/app-maintenance/_components/app-maintenance-filters';
import { useAppMaintenanceFilters } from '@/app/(private)/app-maintenance/_hooks/use-app-maintenance-filters.hook';
import { useAuthUser } from '@/contexts/auth-user.context';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmAppMaintenancesByIdMutation,
  getCrmAppMaintenancesOptions,
  getCrmAppMaintenancesQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { type AppMaintenanceItemResponse, AppMaintenanceSortBy } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  APP_MAINTENANCE_BRAND_LABELS,
  APP_MAINTENANCE_STATUS_LABELS,
} from '../_constants/app-maintenance.constants';

export function AppMaintenanceListSection() {
  const router = useRouter();
  const { hasPermission } = useAuthUser();
  const canEdit = hasPermission(Permission.AppMaintenanceEdit);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppMaintenanceItemResponse | null>(null);
  const queryClient = useQueryClient();

  const filtersHook = useAppMaintenanceFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;

  const { data, isLoading, isFetching } = useQuery({
    ...getCrmAppMaintenancesOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalAllItems = pagination?.totalAllItems ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const deleteMutation = useMutation({
    ...deleteCrmAppMaintenancesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'メンテナンス情報を削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmAppMaintenancesQueryKey() });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('メンテナンス情報の削除に失敗しました');
    },
  });

  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort: AppMaintenanceSortBy.STARTS_AT, order: 'desc' });
      return;
    }
    setFilters({
      sort: next[0].id as typeof filters.sort,
      order: next[0].desc ? 'desc' : 'asc',
    });
  };

  const columns: ColumnDef<AppMaintenanceItemResponse>[] = useMemo(
    () =>
      appMaintenanceColumns({
        onEditClick: canEdit
          ? (id) => {
              router.push(navigate('/app-maintenance/[id]/edit', id));
            }
          : undefined,
        onDeleteClick: (item) => {
          setDeleteTarget(item);
        },
      }),
    [router, canEdit],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="アプリメンテナンス管理"
        badge={
          <Badge
            variant="outline"
            className="text-muted-foreground text-xs font-normal tabular-nums"
          >
            {totalAllItems.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.AppMaintenanceCreate}
            denyTooltip="System権限が必要です"
            className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
            onClick={() => router.push(navigate('/app-maintenance/create'))}
          >
            <Plus className="size-3.5" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
        <Card className="gap-0 overflow-hidden rounded-xl border p-0">
          <AppMaintenanceFilters
            isFilterOpen={isFilterOpen}
            onFilterOpenChange={setIsFilterOpen}
            filtersHook={filtersHook}
          />

          <FilterResultBanner
            show={filtersHook.hasActiveFilters}
            totalCount={totalAllItems}
            filteredCount={totalItems}
            filterSummary={[
              filters.search ? `"${filters.search}"` : '',
              filters.brand ? (APP_MAINTENANCE_BRAND_LABELS[filters.brand] ?? filters.brand) : '',
              filters.status
                ? (APP_MAINTENANCE_STATUS_LABELS[filters.status] ?? filters.status)
                : '',
            ]}
            onClear={filtersHook.clearFilters}
          />

          <DataTable
            tableSize="md"
            columns={columns}
            data={items}
            isLoading={isLoading}
            isFetching={isFetching}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
            }
            onRowClick={
              canEdit
                ? (row) => {
                    router.push(navigate('/app-maintenance/[id]/edit', row.id));
                  }
                : undefined
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: { sorting },
            }}
            emptyContent={
              <Empty
                variant={filtersHook.hasActiveFilters ? 'filtered' : 'empty'}
                entityLabel="メンテナンス"
                onAction={filtersHook.hasActiveFilters ? filtersHook.clearFilters : undefined}
              />
            }
          />

          {totalItems > 0 && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalItems}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <AppMaintenanceDeleteDialog
        target={deleteTarget}
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
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { crmMaintenanceColumns } from '@/app/(private)/crm-maintenance/_components/crm-maintenance-columns';
import {
  CrmMaintenanceDeleteDialog,
  type CrmMaintenanceDeleteTarget,
} from '@/app/(private)/crm-maintenance/_components/crm-maintenance-delete-dialog';
import { CrmMaintenanceFilters } from '@/app/(private)/crm-maintenance/_components/crm-maintenance-filters';
import { useCrmMaintenanceFilters } from '@/app/(private)/crm-maintenance/_hooks/use-crm-maintenance-filters.hook';
import { useAuthUser } from '@/contexts/auth-user.context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmMaintenancesByIdMutation,
  getCrmMaintenancesOptions,
  getCrmMaintenancesQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { type CrmMaintenanceItemResponse, CrmMaintenanceSortBy } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { CRM_MAINTENANCE_STATUS_LABELS } from '../_constants/crm-maintenance.constants';

export function CrmMaintenanceListSection() {
  const router = useRouter();
  const { hasPermission } = useAuthUser();
  const canEdit = hasPermission(Permission.CrmMaintenanceEdit);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CrmMaintenanceDeleteTarget | null>(null);
  const queryClient = useQueryClient();

  const filtersHook = useCrmMaintenanceFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;

  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMaintenancesOptions({ query: queryParams }),
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalAllItems = pagination?.totalAllItems ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const deleteMutation = useMutation({
    ...deleteCrmMaintenancesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'CRMメンテナンス情報を削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmMaintenancesQueryKey() });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(
        (error as { error?: string })?.error || 'CRMメンテナンス情報の削除に失敗しました',
      );
    },
  });

  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort: CrmMaintenanceSortBy.STARTS_AT, order: 'desc' });
      return;
    }
    setFilters({
      sort: next[0].id as typeof filters.sort,
      order: next[0].desc ? 'desc' : 'asc',
    });
  };

  const columns: ColumnDef<CrmMaintenanceItemResponse>[] = useMemo(
    () =>
      crmMaintenanceColumns({
        onEditClick: canEdit
          ? (id) => {
              router.push(navigate('/crm-maintenance/[id]/edit', id));
            }
          : undefined,
        onDeleteClick: (item) => {
          setDeleteTarget({ id: item.id, title: item.title });
        },
      }),
    [router, canEdit],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="CRMメンテナンス管理"
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
            requiredPermission={Permission.CrmMaintenanceCreate}
            denyTooltip="CRMメンテナンス登録は System 権限のみ可能です"
            className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
            onClick={() => router.push(navigate('/crm-maintenance/create'))}
          >
            <Plus className="size-3.5" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
        <Card className="gap-0 overflow-hidden rounded-xl border p-0">
          <CrmMaintenanceFilters
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
              filters.status
                ? (CRM_MAINTENANCE_STATUS_LABELS[filters.status] ?? filters.status)
                : '',
            ]}
            onClear={filtersHook.clearFilters}
          />

          <DataStateBoundary
            isLoading={isLoading}
            isError={isError}
            isEmpty={false}
            onRetry={() => void refetch()}
            errorTitle="CRMメンテナンス一覧の取得に失敗しました"
            skeleton={
              <DataTable
                tableSize="md"
                columns={columns}
                data={[]}
                isLoading
                variant="simple"
                className="rounded-none border-x-0 border-b-0"
              />
            }
          >
            <DataTable
              tableSize="md"
              columns={columns}
              data={items}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={
                isFilterOpen ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
              }
              onRowClick={(row) => {
                router.push(navigate('/crm-maintenance/[id]', row.id));
              }}
              tableOptions={{
                onSortingChange: handleSortingChange,
                manualSorting: true,
                state: { sorting },
              }}
              emptyContent={
                <Empty
                  variant={filtersHook.hasActiveFilters ? 'filtered' : 'empty'}
                  entityLabel="メンテナンス"
                  onAction={filtersHook.clearFilters}
                />
              }
            />
          </DataStateBoundary>

          {totalItems > 0 && !isError && (
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

      <CrmMaintenanceDeleteDialog
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

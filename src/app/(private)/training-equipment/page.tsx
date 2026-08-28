'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import {
  getCrmToolTypesOptions,
  getCrmTrainingEquipmentOptions,
  getCrmTrainingEquipmentQueryKey,
  postCrmTrainingEquipmentBulkStatusUpdateMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { InstallationStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { TrainingEquipmentBulkStatusDialog } from './_components/training-equipment-bulk-status-dialog';
import { TrainingEquipmentCsvExportButton } from './_components/training-equipment-csv-export-button';
import { TrainingEquipmentFilters } from './_components/training-equipment-filters';
import { getTrainingEquipmentTableColumns } from './_components/training-equipment-table-columns';
import {
  INSTALLATION_STATUS_LABELS,
  TRAINING_EQUIPMENT_ENTITY_LABEL,
  TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
  TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS,
  getTrainingEquipmentTableMaxHeightClass,
} from './_constants/training-equipment.constants';
import { useTrainingEquipmentFilters } from './_hooks/use-training-equipment-filters.hook';

function TrainingEquipmentPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthUser();
  const canChangeStatus = hasPermission(Permission.TrainingEquipmentEdit);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const {
    clearFilters,
    currentPage,
    exportParams,
    filters,
    hasActiveFilters,
    isStoreScopeReady,
    pageSize,
    queryParams,
    searchInput,
    setCurrentPage,
    setFilters,
    setPageSize,
    setSearchInput,
  } = useTrainingEquipmentFilters();

  const sorting: SortingState = filters.te_sort
    ? [{ id: filters.te_sort, desc: filters.te_order === 'desc' }]
    : [];

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...getCrmTrainingEquipmentOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
    enabled: isStoreScopeReady,
  });
  const { data: toolTypesRes } = useQuery({ ...getCrmToolTypesOptions() });
  const toolTypes = toolTypesRes?.items ?? [];

  const bulkStatusMutation = useMutation({
    ...postCrmTrainingEquipmentBulkStatusUpdateMutation(),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
      setBulkDialogOpen(false);
      setRowSelection({});

      const newStatus = variables.body?.newStatus;
      if (!newStatus) return;

      const statusLabel = INSTALLATION_STATUS_LABELS[newStatus];
      if (result.updated > 0) {
        toast.success(`${result.updated}件の機材の設置状態を「${statusLabel}」に変更しました`);
      }
      if (result.skipped > 0) {
        toast.info(`${result.skipped}件は設置状態が変わらないためスキップしました`);
      }
    },
  });

  const selectedIds = Object.keys(rowSelection);
  // The scope has to settle before the list can be fetched, so treat the wait as part of loading.
  const isListLoading = isLoading || !isStoreScopeReady;
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.totalItems ?? 0;
  // The API returns the denominator as the count with conditions cleared (when the active filter
  // shows discarded rows they are counted too, so the filtered count can never exceed it).
  const totalAll = pagination?.totalAllItems ?? total;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const columns = useMemo(
    () => getTrainingEquipmentTableColumns({ canSelectRows: canChangeStatus }),
    [canChangeStatus],
  );

  const filterSummary = [
    searchInput ? `検索: "${searchInput}"` : '',
    filters.te_tool
      ? `器具種別: ${toolTypes.find((item) => item.id === filters.te_tool)?.name ?? filters.te_tool}`
      : '',
    filters.te_status !== TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT
      ? `設置状態: ${TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS.find((option) => option.value === filters.te_status)?.label ?? ''}`
      : '',
  ].filter(Boolean);

  const handleBulkStatusSubmit = (payload: {
    newStatus: InstallationStatus;
    changedReason: string;
  }) => {
    if (selectedIds.length === 0) return;
    bulkStatusMutation.mutate({ body: { equipmentIds: selectedIds, ...payload } });
  };

  return (
    <>
      <PageHeader
        title="トレーニング機材管理"
        badge={
          // Without data there is no count yet — showing 「0件」 while loading reads as "no records".
          isListLoading ? (
            <Skeleton className="h-5 w-12 rounded-full" />
          ) : isError ? null : (
            <Badge variant="outline" className="text-xs">
              {totalAll.toLocaleString()}件
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <TrainingEquipmentCsvExportButton query={exportParams} disabled={!isStoreScopeReady} />
            <RoleGatedButton
              requiredPermission={Permission.TrainingEquipmentCreate}
              className="gap-1"
              denyTooltip="トレーニング機材の登録権限がありません"
              onClick={() => router.push(navigate('/training-equipment/create'))}
            >
              <Plus className="size-4" />
              新規登録
            </RoleGatedButton>
          </div>
        }
      />

      <div className="bg-background flex flex-1 flex-col px-6 py-4">
        <Card className="gap-0 overflow-hidden rounded-xl border py-0">
          <div className="space-y-3 px-4 py-3">
            <TrainingEquipmentFilters
              filters={filters}
              toolTypes={toolTypes}
              searchInput={searchInput}
              setFilters={setFilters}
              setSearchInput={setSearchInput}
            />

            {selectedIds.length > 0 && (
              <div className="bg-primary/10 border-primary/20 flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="text-primary text-sm font-medium">
                  {selectedIds.length}件選択中
                </span>
                <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                  選択解除
                </Button>
                <div className="bg-primary/20 h-4 w-px" />
                <RoleGatedButton
                  requiredPermission={Permission.TrainingEquipmentEdit}
                  denyTooltip="設置状態変更の権限がありません"
                  size="sm"
                  onClick={() => setBulkDialogOpen(true)}
                >
                  一括設置状態変更
                </RoleGatedButton>
              </div>
            )}
          </div>

          <FilterResultBanner
            show={hasActiveFilters}
            totalCount={totalAll}
            filteredCount={total}
            filterSummary={filterSummary}
            onClear={clearFilters}
          />

          <DataStateBoundary
            isLoading={isListLoading}
            isError={isError}
            isEmpty={false}
            onRetry={() => void refetch()}
            errorTitle="トレーニング機材一覧の取得に失敗しました"
            skeleton={
              <DataTable
                columns={columns}
                data={[]}
                isLoading
                variant="simple"
                className="rounded-none border-x-0 border-b-0"
              />
            }
          >
            <DataTable
              columns={columns}
              data={items}
              isFetching={isFetching}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={getTrainingEquipmentTableMaxHeightClass(
                hasActiveFilters,
                selectedIds.length > 0,
              )}
              onRowClick={(row) => router.push(navigate('/training-equipment/[id]', row.id))}
              getRowClassName={(row) => (rowSelection[row.id] ? 'bg-primary/10' : undefined)}
              emptyContent={
                <Empty
                  variant={hasActiveFilters ? 'filtered' : 'empty'}
                  entityLabel={TRAINING_EQUIPMENT_ENTITY_LABEL}
                  action={
                    hasActiveFilters ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={clearFilters}
                      >
                        条件をクリア
                      </Button>
                    ) : undefined
                  }
                />
              }
              tableOptions={{
                manualSorting: true,
                enableRowSelection: canChangeStatus,
                getRowId: (originalRow) => originalRow.id,
                onRowSelectionChange: setRowSelection,
                onSortingChange: (updater) => {
                  const next = typeof updater === 'function' ? updater(sorting) : updater;
                  if (next.length === 0) {
                    setFilters({ te_sort: null, te_order: null, te_page: 1 });
                    return;
                  }
                  setFilters({
                    te_sort: next[0]?.id as typeof filters.te_sort,
                    te_order: next[0]?.desc ? 'desc' : 'asc',
                    te_page: 1,
                  });
                },
                state: { sorting, rowSelection },
              }}
            />
          </DataStateBoundary>

          {total > 0 && !isError && (
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

      <TrainingEquipmentBulkStatusDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedCount={selectedIds.length}
        isSubmitting={bulkStatusMutation.isPending}
        isSubmitError={bulkStatusMutation.isError}
        onSubmit={handleBulkStatusSubmit}
      />
    </>
  );
}

export default function TrainingEquipmentPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TrainingEquipmentPageContent />
    </Suspense>
  );
}

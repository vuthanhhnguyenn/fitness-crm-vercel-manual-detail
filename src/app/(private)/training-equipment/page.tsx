'use client';

import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import {
  getCrmTrainingEquipmentOptions,
  getCrmTrainingEquipmentQueryKey,
  postCrmTrainingEquipmentBulkStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { TrainingEquipmentBulkStatusDialog } from './_components/training-equipment-bulk-status-dialog';
import { TrainingEquipmentCsvExportButton } from './_components/training-equipment-csv-export-button';
import { TrainingEquipmentFilters } from './_components/training-equipment-filters';
import { getTrainingEquipmentTableColumns } from './_components/training-equipment-table-columns';
import {
  TRAINING_EQUIPMENT_STATUS_LABELS,
  type TrainingEquipmentStatus,
} from './_constants/training-equipment.constants';
import { useTrainingEquipmentFilters } from './_hooks/use-training-equipment-filters.hook';

function TrainingEquipmentPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthUser();
  const canEdit = hasPermission(Permission.TrainingEquipmentEdit);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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
  } = useTrainingEquipmentFilters();

  const sorting: SortingState = filters.te_sort_by
    ? [{ id: filters.te_sort_by, desc: filters.te_sort_order === 'desc' }]
    : [];

  const { data, isLoading } = useQuery({
    ...getCrmTrainingEquipmentOptions({ query: queryParams }),
  });

  const bulkStatusMutation = useMutation({
    ...postCrmTrainingEquipmentBulkStatusMutation(),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentQueryKey({ query: queryParams }),
      });

      const nextStatus = variables.body?.next_status;
      if (!nextStatus) return;

      const statusLabel = TRAINING_EQUIPMENT_STATUS_LABELS[nextStatus];

      if (result.updated_count > 0) {
        toast.success(`${result.updated_count}件の設置状態を「${statusLabel}」に変更しました`);
      }

      const failedCount = result.results.filter((item) => !item.success).length;
      if (failedCount > 0) {
        toast.error(`${failedCount}件の設置状態変更に失敗しました`);
      }
    },
    onError: () => {
      toast.error('一括設置状態変更に失敗しました');
    },
  });

  const selectedIDs = Object.keys(rowSelection);

  const columns = getTrainingEquipmentTableColumns();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? currentPage;
  const limit = data?.page_size ?? pageSize;
  const isFilteredEmpty = hasActiveFilters && !isLoading && total === 0;

  const handleBulkStatusSubmit = (payload: {
    next_status: TrainingEquipmentStatus;
    reason: string;
  }) => {
    if (selectedIDs.length === 0) return;

    bulkStatusMutation.mutate(
      {
        body: {
          ids: selectedIDs,
          next_status: payload.next_status,
          reason: payload.reason,
        },
      },
      {
        onSuccess: () => {
          setBulkDialogOpen(false);
          setRowSelection({});
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="トレーニング機材管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {total}件
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <TrainingEquipmentCsvExportButton />
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
        {hasActiveFilters && (
          <Alert className="mb-4 py-2">
            <AlertDescription className="flex items-center justify-between text-xs">
              <span>
                <span className="font-medium">{total} 件</span>を抽出中
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 shrink-0 text-xs"
                onClick={clearFilters}
              >
                条件をクリア
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="gap-0 overflow-hidden rounded-xl border py-0">
          <div className="space-y-3 px-4 py-3">
            <TrainingEquipmentFilters
              activeFilterCount={activeFilterCount}
              clearFilterSelects={clearFilterSelects}
              clearFilters={clearFilters}
              filters={filters}
              hasActiveFilters={hasActiveFilters}
              isFilterOpen={isFilterOpen}
              searchInput={searchInput}
              setFilters={setFilters}
              setIsFilterOpen={setIsFilterOpen}
              setSearchInput={setSearchInput}
              showBanner={false}
              total={total}
            />

            {selectedIDs.length > 0 && canEdit && (
              <div className="bg-primary/10 border-primary/20 flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="text-primary text-sm font-medium">
                  {selectedIDs.length}件選択中
                </span>
                <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                  選択解除
                </Button>
                <div className="bg-primary/20 h-4 w-px" />
                <RoleGatedButton
                  requiredPermission={Permission.TrainingEquipmentEdit}
                  denyTooltip="一括設置状態変更の権限がありません"
                  size="sm"
                  onClick={() => setBulkDialogOpen(true)}
                >
                  一括設置状態変更
                </RoleGatedButton>
              </div>
            )}
          </div>

          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-390px)]' : 'max-h-[calc(100vh-330px)]'
            }
            onRowClick={(row) => router.push(navigate('/training-equipment/[id]', row.id))}
            getRowClassName={(row) => (rowSelection[row.id] ? 'bg-primary/10' : undefined)}
            emptyContent={
              isFilteredEmpty ? (
                <div className="flex min-h-60 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <p className="text-muted-foreground text-sm">条件に一致する機材がありません</p>
                  <Button variant="outline" size="sm" className="text-xs" onClick={clearFilters}>
                    条件をクリア
                  </Button>
                </div>
              ) : undefined
            }
            tableOptions={{
              manualSorting: true,
              enableRowSelection: canEdit,
              getRowId: (originalRow) => originalRow.id,
              onRowSelectionChange: setRowSelection,
              onSortingChange: (updater) => {
                const next = typeof updater === 'function' ? updater(sorting) : updater;
                if (next.length === 0) {
                  setFilters({ te_sort_by: null, te_sort_order: null, te_page: 1 });
                  return;
                }
                setFilters({
                  te_sort_by: next[0]?.id as typeof filters.te_sort_by,
                  te_sort_order: next[0]?.desc ? 'desc' : 'asc',
                  te_page: 1,
                });
              },
              state: { sorting, rowSelection },
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

      <TrainingEquipmentBulkStatusDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedCount={selectedIDs.length}
        isSubmitting={bulkStatusMutation.isPending}
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

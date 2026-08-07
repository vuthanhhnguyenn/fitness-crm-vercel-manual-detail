'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getCrmEquipmentOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { EquipmentBulkStatusDialog } from './_components/equipment-bulk-status-dialog';
import { EquipmentFilters } from './_components/equipment-filters';
import { getEquipmentTableColumns } from './_components/equipment-table-columns';
import { useEquipmentBulkStatus } from './_hooks/use-equipment-bulk-status.hook';
import { useEquipmentFilters } from './_hooks/use-equipment-filters';

function EquipmentPageContent() {
  const router = useRouter();
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
  } = useEquipmentFilters();

  const sorting: SortingState = filters.equipment_sort_by
    ? [{ id: filters.equipment_sort_by, desc: filters.equipment_sort_order === 'desc' }]
    : [];

  const { data, isLoading } = useQuery({
    ...getCrmEquipmentOptions({ query: queryParams }),
  });

  const { bulkUpdateStatus, isBulkUpdating } = useEquipmentBulkStatus(queryParams);
  const selectedIDs = Object.keys(rowSelection);

  const columns = useMemo(() => getEquipmentTableColumns(), []);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? currentPage;
  const limit = data?.limit ?? pageSize;
  const isFilteredEmpty = hasActiveFilters && !isLoading && total === 0;

  const handleBulkStatusSubmit = (payload: {
    status: Parameters<typeof bulkUpdateStatus>[0]['status'];
    changeReason?: string;
  }) => {
    if (selectedIDs.length === 0) return;

    bulkUpdateStatus(
      {
        ids: selectedIDs,
        status: payload.status,
        changeReason: payload.changeReason,
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
    <div className="space-y-4">
      <Card className="gap-3 overflow-hidden rounded-xl border p-0">
        <div className="p-3 pb-0">
          <EquipmentFilters
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
            total={total}
          />

          {selectedIDs.length > 0 && (
            <div className="bg-primary/10 border-primary/20 mt-3 flex items-center gap-3 rounded-lg border px-3 py-2">
              <span className="text-primary text-sm font-medium">{selectedIDs.length}件選択中</span>
              <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                選択解除
              </Button>
              <div className="bg-primary/20 h-4 w-px" />
              <RoleGatedButton
                size="sm"
                requiredPermission={Permission.EquipmentEdit}
                denyTooltip="一括状態変更の権限がありません"
                onClick={() => setBulkDialogOpen(true)}
              >
                一括状態変更
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
          onRowClick={(row) => router.push(navigate('/equipment/[id]', row.id))}
          emptyContent={
            isFilteredEmpty ? (
              <div className="flex min-h-60 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <p className="text-muted-foreground text-sm">条件に一致する機器がありません</p>
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
            enableRowSelection: true,
            getRowId: (originalRow) => originalRow.id,
            onRowSelectionChange: setRowSelection,
            onSortingChange: (updater) => {
              const next = typeof updater === 'function' ? updater(sorting) : updater;

              if (next.length === 0) {
                setFilters({
                  equipment_sort_by: 'id',
                  equipment_sort_order: 'asc',
                  equipment_page: 1,
                });
                return;
              }

              setFilters({
                equipment_sort_by: next[0]?.id as
                  | 'id'
                  | 'name'
                  | 'controller_number'
                  | 'qr_code_id'
                  | 'equipment_type'
                  | 'status'
                  | 'updated_at',
                equipment_sort_order: next[0]?.desc ? 'desc' : 'asc',
                equipment_page: 1,
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

      <EquipmentBulkStatusDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedCount={selectedIDs.length}
        isSubmitting={isBulkUpdating}
        onSubmit={handleBulkStatusSubmit}
      />
    </div>
  );
}

export default function EquipmentPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EquipmentPageContent />
    </Suspense>
  );
}

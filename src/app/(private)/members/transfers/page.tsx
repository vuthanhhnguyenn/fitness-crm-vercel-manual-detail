'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RowSelectionState } from '@tanstack/react-table';
import { toast } from 'sonner';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  getCrmStoresOptions,
  getCrmTransfersOptions,
  getCrmTransfersQueryKey,
  patchCrmTransfersByIdApproveMutation,
  patchCrmTransfersByIdRejectMutation,
  postCrmTransfersBulkApproveMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { TransferBulkApproveBar } from './_components/transfer-bulk-approve-bar';
import { TransferBulkApproveDialog } from './_components/transfer-bulk-approve-dialog';
import { TransferDecisionDialog } from './_components/transfer-decision-dialog';
import { TransferFilters } from './_components/transfer-filters';
import {
  type TransferItem,
  TransferTableColumns,
  isTransferSelectable,
} from './_components/transfer-table-columns';
import { TransferFiltersProvider } from './_contexts/transfer-filters-context';
import { useTransferFilters } from './_hooks/use-transfer-filters';

function TransferListPageContent() {
  const router = useRouter();
  const { hasPermission } = useAuthUser();
  const canApprove = hasPermission(Permission.MembersTransfersApprove);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [approveTarget, setApproveTarget] = useState<TransferItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TransferItem | null>(null);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const filtersHook = useTransferFilters();
  const {
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    hasActiveFilters,
    clearFilters,
    buildFilterSummary,
  } = filtersHook;

  const { data, isLoading, isFetching, error } = useQuery({
    ...getCrmTransfersOptions({ query: queryParams }),
    // Keeps the previous page on screen while the next one loads, so the table never blanks.
    placeholderData: keepPreviousData,
  });

  // DataTable owns loading and empty; a query error is a toast, not a full-region swap that
  // would unmount the very filters needed to recover.
  useEffect(() => {
    if (error) toast.error('移籍申請の取得に失敗しました');
  }, [error]);

  const transfers = useMemo(() => data?.transfers ?? [], [data?.transfers]);
  const pagination = data?.pagination;
  /** Scoped + filtered count — drives pagination and the header badge. */
  const total = pagination?.total ?? 0;
  /** Scoped count before filters — the "全 N 件中" half of the banner. */
  const scopedTotal = pagination?.scoped_total ?? 0;

  const invalidateTransfers = () =>
    queryClient.invalidateQueries({ queryKey: getCrmTransfersQueryKey() });

  const { mutate: approve, isPending: isApproving } = useMutation({
    ...patchCrmTransfersByIdApproveMutation(),
    onSuccess: () => {
      const name = approveTarget?.member_name ?? '';
      setApproveTarget(null);
      void invalidateTransfers();
      toast.success(`${name} の移籍申請を承認しました。`);
    },
    onError: () => toast.error('承認処理に失敗しました'),
  });

  const { mutate: reject, isPending: isRejecting } = useMutation({
    ...patchCrmTransfersByIdRejectMutation(),
    onSuccess: () => {
      const name = rejectTarget?.member_name ?? '';
      setRejectTarget(null);
      void invalidateTransfers();
      toast.success(`${name} の移籍申請を否認しました。`);
    },
    onError: () => toast.error('否認処理に失敗しました'),
  });

  const { mutate: bulkApprove, isPending: isBulkApproving } = useMutation({
    ...postCrmTransfersBulkApproveMutation(),
    onSuccess: (result) => {
      setIsBulkDialogOpen(false);
      setRowSelection({});
      void invalidateTransfers();
      const approvedCount = result?.approved.length ?? 0;
      const failures = result?.failed ?? [];
      if (approvedCount > 0) {
        toast.success(`${approvedCount}件のJOYFIT自動移籍を一括承認しました。`);
      }
      // A partial failure must be surfaced — silently reporting only the successes would leave
      // the operator believing the whole batch went through.
      if (failures.length > 0) {
        toast.error(`${failures.length}件は承認できませんでした`, {
          description: failures.map((f) => `${f.id}: ${f.reason}`).join('\n'),
        });
      }
    },
    onError: () => toast.error('一括承認に失敗しました'),
  });

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  /**
   * Selection is keyed by transfer id (via `getRowId` below), not row index, so a selection
   * made before a search/filter change can't silently land on a different transfer that
   * happens to occupy the same row position afterwards. Narrowing the results can still leave
   * a selected id out of the new result set entirely, so drop it once the new page of data for
   * the changed filters has actually arrived (not the stale `keepPreviousData` page).
   */
  const filterSignature = JSON.stringify({
    search: queryParams.search,
    status: queryParams.status,
    from_store_id: queryParams.from_store_id,
    to_store_id: queryParams.to_store_id,
    store_id: queryParams.store_id,
    brand: queryParams.brand,
    applied_period: queryParams.applied_period,
    auto_transfer: queryParams.auto_transfer,
  });
  const prevFilterSignatureRef = useRef(filterSignature);
  const pendingPruneRef = useRef(false);

  useEffect(() => {
    if (prevFilterSignatureRef.current !== filterSignature) {
      prevFilterSignatureRef.current = filterSignature;
      pendingPruneRef.current = true;
    }
  }, [filterSignature]);

  useEffect(() => {
    if (!pendingPruneRef.current) return;
    pendingPruneRef.current = false;
    const validIds = new Set(transfers.map((transfer) => transfer.id));
    setRowSelection((prev) => {
      const next: RowSelectionState = {};
      for (const id of Object.keys(prev)) {
        if (prev[id] && validIds.has(id)) next[id] = true;
      }
      return next;
    });
  }, [transfers]);

  const columns = useMemo(
    () =>
      TransferTableColumns({
        onApproveClick: setApproveTarget,
        onRejectClick: setRejectTarget,
        canApprove,
      }),
    [canApprove],
  );

  // Same query key as the filter dropdown's, so React Query serves it from cache rather than
  // firing a second request. Without it the banner would name stores by raw id.
  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({
      query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });
  const storeNameById = useMemo(() => {
    const byId = new Map((storesRes?.stores ?? []).map((s) => [s.id, s.name]));
    return (id: string) => byId.get(id);
  }, [storesRes?.stores]);

  const filterSummary = buildFilterSummary(storeNameById);

  return (
    <div>
      <PageHeader
        title="移籍管理"
        badge={
          <Badge variant="secondary" className="text-xs">
            {total.toLocaleString()}件
          </Badge>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="gap-0 overflow-hidden rounded-xl p-0">
          <div className="flex flex-col gap-3 px-4 pt-4 pb-0">
            <TransferBulkApproveBar
              selectedCount={selectedIds.length}
              onClearSelection={() => setRowSelection({})}
              onBulkApprove={() => setIsBulkDialogOpen(true)}
            />
          </div>

          <TransferFiltersProvider value={filtersHook}>
            <TransferFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
          </TransferFiltersProvider>

          <FilterResultBanner
            show={hasActiveFilters}
            totalCount={scopedTotal}
            filteredCount={total}
            filterSummary={filterSummary}
            onClear={clearFilters}
          />

          <DataTable
            columns={columns}
            data={transfers}
            isLoading={isLoading}
            isFetching={isFetching}
            variant="simple"
            onRowClick={(row) => router.push(navigate('/members/transfers/[id]', row.id))}
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-380px)]' : 'max-h-[calc(100vh-330px)]'
            }
            tableOptions={{
              getRowId: (row) => row.id,
              state: { rowSelection },
              onRowSelectionChange: setRowSelection,
              enableRowSelection: (row) => isTransferSelectable(row.original),
            }}
            emptyContent={
              <Empty
                variant={hasActiveFilters ? 'filtered' : 'empty'}
                entityLabel="移籍"
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            }
          />

          <TablePaginationWithSize
            total={total}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>

      <TransferDecisionDialog
        action="approve"
        transfer={approveTarget}
        isPending={isApproving}
        onCancel={() => setApproveTarget(null)}
        onConfirm={(comment) => {
          if (approveTarget) {
            approve({ path: { id: approveTarget.id }, body: { comment } });
          }
        }}
      />

      <TransferDecisionDialog
        action="reject"
        transfer={rejectTarget}
        isPending={isRejecting}
        onCancel={() => setRejectTarget(null)}
        onConfirm={(comment) => {
          if (rejectTarget) {
            reject({ path: { id: rejectTarget.id }, body: { comment } });
          }
        }}
      />

      <TransferBulkApproveDialog
        open={isBulkDialogOpen}
        selectedCount={selectedIds.length}
        isPending={isBulkApproving}
        onOpenChange={setIsBulkDialogOpen}
        onConfirm={(comment) => bulkApprove({ body: { transfer_ids: selectedIds, comment } })}
      />
    </div>
  );
}

export default function TransferListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      }
    >
      <TransferListPageContent />
    </Suspense>
  );
}

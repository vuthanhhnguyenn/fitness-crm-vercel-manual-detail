'use client';

// Client component: nuqs-backed filter/sort/pagination state and row-selection state
// require the browser. Decision mutations live in RefundDecisionDialog.
import { Suspense, useState } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Card } from '@/components/ui/card';

import { getCrmBillingRecordsRefundRequestsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { RefundQueueEntry, StaffRole } from '@/lib/api/types.gen';
import { canApproveRefund } from '@/lib/utils/refund-approval';

import { RefundBulkActionBar } from './_components/refund-bulk-action-bar';
import { RefundCsvExportButton } from './_components/refund-csv-export-button';
import type { RefundConfirmAction } from './_components/refund-decision-dialog';
import { RefundDecisionDialog } from './_components/refund-decision-dialog';
import { RefundDetailSheet } from './_components/refund-detail-sheet';
import { RefundFilters } from './_components/refund-filters';
import { RefundPendingBanner } from './_components/refund-pending-banner';
import {
  PAYMENT_METHOD_LABELS,
  REFUND_STATUS_LABELS,
  REQUESTER_ROLE_FILTER_LABELS,
  getRefundQueueColumns,
} from './_components/refund-queue-table';
import { useRefundFilters } from './_hooks/use-refund-filters.hook';

function toStaffRole(role: string): StaffRole {
  return role.toLowerCase() as StaffRole;
}

function SalesRefundsPageContent() {
  const { user } = useAuthUser();
  const currentRole = toStaffRole(user?.role ?? 'staff');

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [detailEntry, setDetailEntry] = useState<RefundQueueEntry | null>(null);
  const [confirmAction, setConfirmAction] = useState<RefundConfirmAction | null>(null);

  const filterState = useRefundFilters();
  const { filters, setFilters, queryParams, currentPage, pageSize, setCurrentPage, setPageSize } =
    filterState;

  const sorting: SortingState = filters.rf_sort_by
    ? [{ id: filters.rf_sort_by, desc: filters.rf_sort_order === 'desc' }]
    : [];

  // TODO(CODE-RULE-II): query error state isn't surfaced via DataStateBoundary with a
  // retry action (matches the same pre-existing gap in the sibling transactions/receivables
  // list pages) — follow-up issue required to add isError + retry handling across all three.
  const { data, isLoading } = useQuery(
    getCrmBillingRecordsRefundRequestsOptions({ query: queryParams }),
  );

  const items = data?.items ?? [];
  const total = data?.total_count ?? 0;
  const totalAllItems = data?.total_all_items ?? 0;
  const pendingSummary = data?.pending_summary ?? { pending_count: 0, pending_amount: 0 };
  const columns = getRefundQueueColumns();

  const selectedIds = Object.keys(rowSelection);
  const selectedEntries = items.filter((item) => rowSelection[item.refund_id]);
  const approvableSelectedIds = selectedEntries
    .filter((item) => canApproveRefund(currentRole, item.requester_role))
    .map((item) => item.refund_id);
  const nonApprovableCount = selectedIds.length - approvableSelectedIds.length;

  function handleDecisionSuccess() {
    if (confirmAction?.kind === 'bulk') {
      setRowSelection({});
    } else {
      setDetailEntry(null);
    }
    setConfirmAction(null);
  }

  const filterSummary = [
    filters.rf_status ? `ステータス ${REFUND_STATUS_LABELS[filters.rf_status]}` : '',
    filters.rf_payment_method ? `決済手段 ${PAYMENT_METHOD_LABELS[filters.rf_payment_method]}` : '',
    filters.rf_requester_role
      ? `申請者ロール ${REQUESTER_ROLE_FILTER_LABELS[filters.rf_requester_role]}`
      : '',
    filters.rf_date_from || filters.rf_date_to
      ? `申請日 ${filters.rf_date_from ?? ''}〜${filters.rf_date_to ?? ''}`
      : '',
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="返金手続き一覧"
        actions={
          <RefundCsvExportButton
            filters={{
              requester_role: filters.rf_requester_role ?? undefined,
              date_from: filters.rf_date_from ?? undefined,
              date_to: filters.rf_date_to ?? undefined,
              search: filters.rf_search || undefined,
            }}
          />
        }
      />

      <div className="bg-background flex flex-1 flex-col px-6 py-4">
        <div className="space-y-4">
          <RefundPendingBanner
            pendingCount={pendingSummary.pending_count}
            pendingAmount={pendingSummary.pending_amount}
          />

          <Card className="gap-0 overflow-hidden rounded-xl border py-0">
            <div className="space-y-3 px-4 py-3">
              <RefundFilters filterState={filterState} />

              <RefundBulkActionBar
                selectedCount={selectedIds.length}
                approvableCount={approvableSelectedIds.length}
                excludedCount={nonApprovableCount}
                onClear={() => setRowSelection({})}
                onApprove={() =>
                  setConfirmAction({
                    kind: 'bulk',
                    decision: 'approve',
                    approvableIds: approvableSelectedIds,
                    excludedCount: nonApprovableCount,
                  })
                }
                onReject={() =>
                  setConfirmAction({
                    kind: 'bulk',
                    decision: 'reject',
                    approvableIds: approvableSelectedIds,
                    excludedCount: nonApprovableCount,
                  })
                }
              />
            </div>

            <FilterResultBanner
              show={filterState.hasActiveFilters}
              totalCount={totalAllItems}
              filteredCount={total}
              filterSummary={filterSummary}
              onClear={filterState.clearFilters}
            />

            <DataTable
              columns={columns}
              data={items}
              isLoading={isLoading}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              onRowClick={(row) => setDetailEntry(row)}
              emptyContent={
                <Empty
                  variant={filterState.hasActiveFilters ? 'filtered' : 'empty'}
                  entityLabel="返金手続き"
                  onAction={filterState.hasActiveFilters ? filterState.clearFilters : undefined}
                />
              }
              tableOptions={{
                manualSorting: true,
                enableRowSelection: (row) => row.original.status === 'pending',
                getRowId: (originalRow) => originalRow.refund_id,
                onRowSelectionChange: setRowSelection,
                onSortingChange: (updater) => {
                  const next = typeof updater === 'function' ? updater(sorting) : updater;
                  if (next.length === 0) {
                    setFilters({ rf_sort_by: null, rf_sort_order: null, rf_page: 1 });
                    return;
                  }
                  setFilters({
                    rf_sort_by: next[0]?.id as typeof filters.rf_sort_by,
                    rf_sort_order: next[0]?.desc ? 'desc' : 'asc',
                    rf_page: 1,
                  });
                },
                state: { sorting, rowSelection },
              }}
            />

            {total > 0 && (
              <TablePaginationWithSize
                total={total}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100, 200]}
              />
            )}
          </Card>
        </div>
      </div>

      <RefundDetailSheet
        entry={detailEntry}
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        currentRole={currentRole}
        onDecide={(decision) => {
          if (!detailEntry) return;
          setConfirmAction({ kind: 'single', decision, entry: detailEntry });
        }}
      />

      <RefundDecisionDialog
        action={confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onSuccess={handleDecisionSuccess}
      />
    </>
  );
}

export default function SalesRefundsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SalesRefundsPageContent />
    </Suspense>
  );
}

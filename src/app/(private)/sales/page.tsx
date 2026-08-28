'use client';

// Client component: nuqs-backed filters/pagination and React Query mutations require browser state.
import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { Lock, Plus } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { MonthPicker } from '@/components/common/month-picker';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import {
  getCrmBillingRecordsOptions,
  getCrmStoresOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { SalesBulkConfirmDialog } from './_components/sales-bulk-confirm-dialog';
import { SalesBulkRefundDialog } from './_components/sales-bulk-refund-dialog';
import { SalesCsvExportButton } from './_components/sales-csv-export-button';
import { BILLING_TYPE_LABELS, SalesFilters } from './_components/sales-filters';
import { SalesSummary } from './_components/sales-summary';
import { getSalesTableColumns } from './_components/sales-table-columns';
import { useSalesFilters } from './_hooks/use-sales-filters.hook';

const CONFIRMATION_STATUS_LABELS: Record<string, string> = {
  unconfirmed: '未確定',
  confirmed: '確定済',
};

function toMonthPickerValue(month: string): string {
  return month.replace('-', '/');
}

function fromMonthPickerValue(value: string): string {
  return value.replace('/', '-');
}

function SalesPageContent() {
  const router = useRouter();
  const { hasPermission } = useAuthUser();
  const canConfirm = hasPermission(Permission.SalesConfirm);
  const canRefund = hasPermission(Permission.SalesRefundInitiate);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkRefundOpen, setBulkRefundOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const filterState = useSalesFilters();
  const {
    filters,
    setFilters,
    queryParams,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    hasActiveFilters,
    clearFilters,
  } = filterState;

  const sorting: SortingState = filters.sf_sort_by
    ? [{ id: filters.sf_sort_by, desc: filters.sf_sort_order === 'desc' }]
    : [];

  const { data, isLoading } = useQuery(getCrmBillingRecordsOptions({ query: queryParams }));

  // Store name lookup for the filter-result summary label only (the select's own
  // options are fetched independently inside SalesFilters).
  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions(),
    enabled: Boolean(filters.sf_store_id),
  });
  const storeName = storesRes?.stores.find((store) => store.id === filters.sf_store_id)?.name;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalAllItems = data?.total_all_items ?? 0;
  const columns = getSalesTableColumns();
  const filterSummary = [
    filters.sf_search ? `"${filters.sf_search}"` : '',
    filters.sf_confirmation_status
      ? CONFIRMATION_STATUS_LABELS[filters.sf_confirmation_status]
      : '',
    storeName ? `店舗: ${storeName}` : '',
    filters.sf_billing_type ? BILLING_TYPE_LABELS[filters.sf_billing_type] : '',
    filters.sf_unpaid_only ? '未納のみ' : '',
  ].filter(Boolean);
  const selectedIds = Object.keys(rowSelection);
  const selectedRecords = items.filter((item) => rowSelection[item.id]);
  const unconfirmedSelectedRecords = selectedRecords.filter(
    (item) => item.confirmation_status === 'unconfirmed',
  );
  const hasUnconfirmedSelected = unconfirmedSelectedRecords.length > 0;

  return (
    <>
      <PageHeader
        title="売上管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {total}件
          </Badge>
        }
        dateControl={
          <MonthPicker
            value={toMonthPickerValue(filters.sf_month)}
            showArrows
            onChange={(value) => setFilters({ sf_month: fromMonthPickerValue(value), sf_page: 1 })}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <SalesCsvExportButton
              billingMonth={filters.sf_month}
              storeId={filters.sf_store_id ?? undefined}
            />
            <RoleGatedButton
              requiredPermission={Permission.SalesManualRegister}
              className="gap-1"
              denyTooltip="請求を追加する権限がありません"
              onClick={() => router.push(navigate('/sales/register'))}
            >
              <Plus className="size-4" />
              請求の手動追加
            </RoleGatedButton>
          </div>
        }
      />

      <div className="bg-background flex flex-1 flex-col px-6 py-4">
        <div className="space-y-4">
          <SalesSummary
            billingMonth={filters.sf_month}
            storeId={filters.sf_store_id ?? undefined}
          />

          <Card className="gap-0 overflow-hidden rounded-xl border py-0">
            <div className="space-y-3 px-4 py-3">
              <SalesFilters filterState={filterState} />

              {selectedIds.length > 0 && (
                <div className="bg-primary/10 border-primary/20 flex items-center gap-3 rounded-lg border px-3 py-2">
                  <span className="text-primary text-sm font-medium">
                    {selectedIds.length}件選択中
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                    選択解除
                  </Button>
                  <div className="bg-primary/20 h-4 w-px" />
                  {canRefund && (
                    <RoleGatedButton
                      requiredPermission={Permission.SalesRefundInitiate}
                      size="sm"
                      onClick={() => setBulkRefundOpen(true)}
                    >
                      返金申請
                    </RoleGatedButton>
                  )}
                  {canConfirm && (
                    <RoleGatedButton
                      requiredPermission={Permission.SalesConfirm}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={!hasUnconfirmedSelected}
                      onClick={() => setBulkConfirmOpen(true)}
                    >
                      <Lock className="size-3" />
                      確定
                    </RoleGatedButton>
                  )}
                </div>
              )}
            </div>

            <FilterResultBanner
              show={hasActiveFilters}
              totalCount={totalAllItems}
              filteredCount={total}
              filterSummary={filterSummary}
              onClear={clearFilters}
            />

            <DataTable
              columns={columns}
              data={items}
              isLoading={isLoading}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              onRowClick={(row) => router.push(navigate('/sales/[id]', row.id))}
              getRowClassName={(row) =>
                [
                  row.outstanding_amount > 0 && 'bg-destructive/10',
                  rowSelection[row.id] && 'bg-primary/10',
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
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
                      sf_sort_by: null,
                      sf_sort_order: null,
                      sf_page: 1,
                    });
                    return;
                  }
                  setFilters({
                    sf_sort_by: next[0]?.id as typeof filters.sf_sort_by,
                    sf_sort_order: next[0]?.desc ? 'desc' : 'asc',
                    sf_page: 1,
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
                pageSizeOptions={[20, 50, 100]}
              />
            )}
          </Card>
        </div>
      </div>

      <SalesBulkRefundDialog
        open={bulkRefundOpen}
        onOpenChange={setBulkRefundOpen}
        billingRecordIds={selectedIds}
        onSuccess={() => setRowSelection({})}
      />

      <SalesBulkConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        selectedIds={selectedIds}
        unconfirmedSelectedRecords={unconfirmedSelectedRecords}
        onSuccess={() => setRowSelection({})}
      />
    </>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SalesPageContent />
    </Suspense>
  );
}

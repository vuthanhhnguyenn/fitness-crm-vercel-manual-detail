'use client';

// Client component: nuqs-backed filters/pagination and a row-level refund dialog require browser state.
import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  getCrmBillingRecordsTransactionsOptions,
  getCrmStoresOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { TransactionRecord } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { TransactionRefundRequestDialog } from './_components/transaction-refund-request-dialog';
import { TransactionsCsvExportButton } from './_components/transactions-csv-export-button';
import { PAYMENT_METHOD_LABELS, TransactionsFilters } from './_components/transactions-filters';
import {
  TRANSACTION_TYPE_LABELS,
  getTransactionsTableColumns,
} from './_components/transactions-table';
import { useTransactionsFilters } from './_hooks/use-transactions-filters.hook';

function SalesTransactionsPageContent() {
  const router = useRouter();
  const [refundRow, setRefundRow] = useState<TransactionRecord | null>(null);

  const filterState = useTransactionsFilters();
  const {
    filters,
    queryParams,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    hasActiveFilters,
    clearFilters,
  } = filterState;

  const { data, isLoading, isError, refetch } = useQuery(
    getCrmBillingRecordsTransactionsOptions({ query: queryParams }),
  );

  // Store name lookup for the filter-result summary label only (the select's own
  // options are fetched independently inside TransactionsFilters).
  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions(),
    enabled: Boolean(filters.tf_store_id),
  });
  const storeName = storesRes?.stores.find((store) => store.id === filters.tf_store_id)?.name;

  const items = data?.items ?? [];
  const total = data?.total_count ?? 0;
  const totalAllItems = data?.total_all_items ?? 0;
  const columns = getTransactionsTableColumns({ onRequestRefund: setRefundRow });

  const filterSummary = [
    filters.tf_search ? `"${filters.tf_search}"` : '',
    filters.tf_transaction_type
      ? `種別: ${TRANSACTION_TYPE_LABELS[filters.tf_transaction_type]}`
      : '',
    filters.tf_payment_method ? `決済: ${PAYMENT_METHOD_LABELS[filters.tf_payment_method]}` : '',
    storeName ? `店舗: ${storeName}` : '',
    filters.tf_date_from ? `開始: ${filters.tf_date_from}` : '',
    filters.tf_date_to ? `終了: ${filters.tf_date_to}` : '',
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="入出金明細"
        badge={
          <Badge variant="outline" className="text-xs">
            {total}件
          </Badge>
        }
        actions={
          <TransactionsCsvExportButton
            filters={queryParams}
            total={total}
            filterSummary={filterSummary}
          />
        }
      />

      <div className="bg-background flex flex-1 flex-col px-6 py-4">
        <div className="space-y-4">
          <Card className="gap-0 overflow-hidden rounded-xl border py-0">
            <div className="px-4 py-3">
              <TransactionsFilters filterState={filterState} />
            </div>

            <FilterResultBanner
              show={hasActiveFilters}
              totalCount={totalAllItems}
              filteredCount={total}
              filterSummary={filterSummary}
              onClear={clearFilters}
            />

            <DataStateBoundary
              isLoading={isLoading}
              isError={isError}
              isEmpty={false}
              onRetry={() => refetch()}
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
                variant="simple"
                className="rounded-none border-x-0 border-b-0"
                onRowClick={(row) => router.push(navigate('/sales/[id]', row.billing_record_id))}
                emptyContent={
                  <Empty
                    variant={hasActiveFilters ? 'filtered' : 'empty'}
                    entityLabel="取引"
                    onAction={hasActiveFilters ? clearFilters : undefined}
                  />
                }
              />
            </DataStateBoundary>

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

      <TransactionRefundRequestDialog
        row={refundRow}
        onOpenChange={(open) => {
          if (!open) setRefundRow(null);
        }}
      />
    </>
  );
}

export default function SalesTransactionsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SalesTransactionsPageContent />
    </Suspense>
  );
}
